"""Gatto Giudice AIVEVIA: servizio Piper TTS locale (nessun servizio vocale a pagamento).

Esecuzione Windows/Linux: python -m uvicorn voice_server.server:app --host 127.0.0.1 --port 8765
Per accesso da Cloudflare Tunnel esporre solo l'endpoint via cloudflared,
impostando VOICE_SHARED_SECRET identico a TTS_SECRET del Worker.
"""
from __future__ import annotations
import io
import logging
import os
from pathlib import Path
import subprocess
import sys
import threading
import wave
from collections import OrderedDict

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field

LOG = logging.getLogger("gatto.voce")
app = FastAPI(title="Gatto Giudice: voci AI libere", docs_url=None, redoc_url=None)
VOICE_DIR = Path(os.environ.get("VOICE_DIR", "./voice_server/modelli")).resolve()
MAX_CACHED_MODELS = 3

# La scelta delle voci puo' variare; il dizionario e' esplicito e verificabile.
# Nessuna voce usa i servizi di sintesi di Apple/Google.
MODELS = {
    "it": "it_IT-paola-medium",
    "es": "es_ES-davefx-medium",
    "en": "en_US-amy-medium",
    "pt": "pt_PT-tugão-medium",
    "fr": "fr_FR-siwis-medium",
    "de": "de_DE-thorsten-medium",
    "nl": "nl_NL-mls-medium",
    "pl": "pl_PL-gosia-medium",
    "ru": "ru_RU-irina-medium",
    "tr": "tr_TR-dfki-medium",
    "ar": "ar_JO-kareem-medium",
    "zh": "zh_CN-huayan-medium",
}
CHARACTERS = {
    "dolce": {"length_scale": 0.96, "noise_scale": 0.72, "noise_w_scale": 0.72},
    "severo": {"length_scale": 1.21, "noise_scale": 0.55, "noise_w_scale": 0.70},
    "ironico": {"length_scale": 0.86, "noise_scale": 0.85, "noise_w_scale": 0.85},
}
_model_lock = threading.RLock()
_synthesis_lock = threading.Lock()
_models: OrderedDict[str, object] = OrderedDict()


class SpeechRequest(BaseModel):
    text: str = Field(min_length=1, max_length=260)
    lang: str
    character: str


def _require_token(authorization: str | None) -> None:
    import hmac
    expected = os.environ.get("VOICE_SHARED_SECRET", "")
    if not expected or len(expected) < 24:
        raise HTTPException(status_code=503, detail="Token interno del motore non configurato")
    token = (authorization or "").removeprefix("Bearer ").strip()
    if not hmac.compare_digest(expected, token):
        raise HTTPException(status_code=401, detail="Non autorizzato")


def _load_voice(language: str):
    from piper import PiperVoice
    model_name = MODELS[language]
    with _model_lock:
        if model_name in _models:
            _models.move_to_end(model_name)
            return _models[model_name]

        VOICE_DIR.mkdir(parents=True, exist_ok=True)
        model_path = VOICE_DIR / (model_name + ".onnx")
        config_path = VOICE_DIR / (model_name + ".onnx.json")
        if not model_path.is_file() or not config_path.is_file():
            # Programma Piper ufficiale; argomenti selezionati dalla whitelist.
            LOG.info("Download modello vocale per lingua %s", language)
            result = subprocess.run(
                [sys.executable, "-m", "piper.download_voices",
                 "--data-dir", str(VOICE_DIR), model_name],
                capture_output=True, text=True, timeout=240, check=False
            )
            if result.returncode or not model_path.is_file() or not config_path.is_file():
                LOG.error("Download voce fallito per %s: %s", language, result.stderr[-200:])
                raise RuntimeError("Modello vocale non disponibile per la lingua selezionata")
        model = PiperVoice.load(str(model_path))
        _models[model_name] = model
        if len(_models) > MAX_CACHED_MODELS:
            _models.popitem(last=False)
        return model


def create_wav(request: SpeechRequest) -> bytes:
    from piper import SynthesisConfig
    if request.lang not in MODELS or request.character not in CHARACTERS:
        raise ValueError("Lingua o personaggio non supportato")
    voice = _load_voice(request.lang)
    config = SynthesisConfig(**CHARACTERS[request.character])
    data = io.BytesIO()
    # Blocchiamo soltanto la sintesi; il modello non e' thread safe.
    with _synthesis_lock:
        with wave.open(data, "wb") as wav_file:
            voice.synthesize_wav(request.text, wav_file, syn_config=config)
    result = data.getvalue()
    if len(result) < 400:
        raise RuntimeError("Piper non ha prodotto audio valido")
    return result


@app.get("/health")
def health():
    return {"ok": True, "engine": "Piper offline", "languages": sorted(MODELS)}


@app.post("/voce")
def speak(req: SpeechRequest, authorization: str | None = Header(default=None)):
    _require_token(authorization)
    if req.lang not in MODELS or req.character not in CHARACTERS:
        raise HTTPException(status_code=400, detail="Lingua o gatto non supportato")
    try:
        audio = create_wav(req)
    except Exception:
        LOG.exception("Errore sintesi vocale (%s)", req.lang)
        raise HTTPException(status_code=503, detail="Motore vocale temporaneamente non disponibile")
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"Cache-Control": "no-store", "X-Content-Type-Options": "nosniff"}
    )
