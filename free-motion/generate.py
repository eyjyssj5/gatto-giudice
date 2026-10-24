#!/usr/bin/env python3
"""Free GPU real image-to-video trial, original approved Gatto Giudice imagery."""
import json, os, pathlib, subprocess, sys, time
from urllib.parse import quote, urljoin
import requests
from PIL import Image
from io import BytesIO

base = "https://cbensimon-wan2-2-fp8da-aoti-preview2.hf.space"
dest = pathlib.Path("free-motion/result")
dest.mkdir(parents=True,exist_ok=True)
cats = {
    "dolce": ("app-source/www/img/gatto-dolce-approvato.png",
      "Photorealistic still-camera shot of the EXACT same friendly cat judge in its original robe and courtroom. For one short deliberate action, the CAT ITSELF turns its head to the right, its ears rotate naturally and one front paw lifts from the table, moves forward with true shoulder/elbow/paw joint anatomy, then rests on the table. Natural animal physics. The body stays firmly seated, head moves separately. No camera movements, no background movements, no swinging, no wind, no stretching photo, no morphing, no deformation, no breathing loop, no moving costume."),
    "severo": ("app-source/www/img/gatto-severo-approvato.png",
      "The SAME realistic stern cat judge moves its head slowly to the viewer, frowns subtly and makes one short deliberate natural front paw tap on the desk. Genuine feline shoulder and elbow joint articulation. The camera, robe and environment are completely still. No waving or photograph deformation."),
    "ironico": ("app-source/www/img/gatto-ironico.png",
      "Same sly cat judge tilts its head a little to one side in an amused and sarcastic way. One natural front paw gesture. Anatomically correct cat movement. Camera fixed, environment rigid. No bouncy wobble or image warping."),
    "corrotto": ("app-source/www/img/gatto-corrotto-approvato.png",
      "Same sly cat judge looks down at a coin, naturally turns head and reaches toward the coin with an articulated paw. Genuine realistic feline motion. Camera fixed, no waving body or background."),
    "pigro": ("app-source/www/img/gatto-pigro-approvato.png",
      "Same very sleepy cat judge keeps eyes closed the ENTIRE time and slowly stretches one front paw, relaxing onto the desk naturally. No eye flickers, no camera motion or body warping."),
    "supremo": ("app-source/www/img/gatto-supremo.png",
      "Same imposing supreme cat judge lifts its head dignifiedly, then gently lifts one front paw as a decree gesture and rests still. Realistic cat anatomy, camera fixed, no warped photo or moving robe."),
}
which = os.getenv("CAT", "dolce")
assert which in cats
source,prompt=cats[which]
assert pathlib.Path(source).is_file()
im = Image.open(source).convert("RGB")
im.thumbnail((832,832), Image.Resampling.LANCZOS)
tmp = BytesIO();im.save(tmp,format="JPEG",quality=90)
print("UPLOADING ORIGINAL CAT IMAGE",which,len(tmp.getvalue()),flush=True)
try:
    r=requests.post(base+"/gradio_api/upload",files={"files":(which+".jpg",tmp.getvalue(),"image/jpeg")},timeout=90)
    print("UPLOAD_HTTP",r.status_code,r.text[:800],flush=True)
    r.raise_for_status()
    uploaded=r.json()[0]
    obj={
      "path":uploaded,
      "url":base+"/gradio_api/file="+quote(uploaded,safe="/"),
      "orig_name":which+".jpg",
      "size":len(tmp.getvalue()),
      "mime_type":"image/jpeg",
      "meta":{"_type":"gradio.FileData"},
    }
    args=[obj,None,prompt,4,
      "photo wobble, moving background, deforming face, distorted paws, extra legs, unnatural eye flicker, slow breathing illusion, camera zoom, wave, spring, blinking lights",
      2.5,1,1,42,True,6,"UniPCMultistep",3.0,16,False,True]
    r=requests.post(base+"/gradio_api/call/generate_video",json={"data":args},timeout=90)
    print("SUBMISSION_HTTP",r.status_code,r.text[:1200],flush=True)
    r.raise_for_status()
    event_id=r.json()["event_id"]
    print("EVENT_ID",event_id,flush=True)
    event=None; lines=[]; t0=time.time(); data=None
    with requests.get(base+"/gradio_api/call/generate_video/"+event_id,headers={"Accept":"text/event-stream"},timeout=(30,900),stream=True) as s:
      print("SSE_HTTP",s.status_code,flush=True)
      s.raise_for_status()
      for line in s.iter_lines(decode_unicode=True):
        if line is None:continue
        if isinstance(line,bytes):line=line.decode("utf-8","replace")
        if line.startswith("event:"):event=line[6:].strip()
        elif line.startswith("data:"):
          payload=line[5:].strip()
          if event=="complete":
            print("COMPLETE",payload[:2500],flush=True)
            data=json.loads(payload);break
          if event=="error":raise RuntimeError("HuggingFace public GPU error: "+payload[:1500])
          if event in ("progress","generating","heartbeat","pending"):
            if int(time.time()-t0)%15==0:print("EVENT",event,payload[:180],flush=True)
        if time.time()-t0>1000:raise TimeoutError("GPU free shared quota timeout")
    if data is None:raise RuntimeError("No completed video returned from public GPU queue")
    candidates=[]
    def walk(v):
      if isinstance(v,dict):
        if isinstance(v.get("url"),str):candidates.append(v["url"])
        if isinstance(v.get("path"),str):candidates.append(v["path"])
        for y in v.values():walk(y)
      elif isinstance(v,list):
        for y in v:walk(y)
      elif isinstance(v,str) and (".mp4" in v or "file=" in v):candidates.append(v)
    walk(data)
    candidates=[v for v in candidates if ".mp4" in v or "file=" in v]
    print("OUTPUT_CANDIDATES",candidates[:8],flush=True)
    assert candidates,"No MP4 in generated output"
    u=next((v for v in candidates if v.startswith("https://")),None)
    if u is None:
      u=base+"/gradio_api/file="+quote(candidates[0],safe="/")
    r=requests.get(u,timeout=180)
    print("VIDEO_HTTP",r.status_code,"BYTES",len(r.content),flush=True)
    r.raise_for_status()
    assert len(r.content)>20000, "Video bytes too small"
    name=dest/(which+".mp4")
    name.write_bytes(r.content)
    subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","default=noprint_wrappers=1",str(name)],check=True)
    print("REAL_VIDEO_SAVED",str(name),name.stat().st_size,flush=True)
except Exception as e:
    print("FAILURE",repr(e),flush=True)
    sys.exit(2)
