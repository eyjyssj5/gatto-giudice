FROM python:3.11-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 VOICE_DIR=/models
WORKDIR /service
COPY requirements.txt /service/requirements.txt
RUN pip install --no-cache-dir -r /service/requirements.txt && \
    python -c "from piper import PiperVoice, SynthesisConfig; print('Piper disponibile')"
COPY server.py /service/server.py
RUN useradd -u 10001 -m tts && mkdir -p /models && chown tts:tts /models
USER tts
EXPOSE 8765
CMD ["uvicorn","server:app","--host","0.0.0.0","--port","8765","--workers","1"]
