# V23 personale: generate reaction clips from the six approved portraits.
# No full-frame transform, no artificial blinking and no automatic idle animation.
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, argparse

CATS={
 'dolce':('gatto-dolce-approvato.png',None, [
  ((95,5,325,180),(0,0),(0,-6),(-2,2),'nod'),
  ((10,95,150,300),(0,6),(0,-8),(-3,3),'wave'),
  ((255,220,360,315),(0,0),(0,-4),(0,0),'breath')]),
 'severo':('gatto-severo-approvato.png',None,[
  ((105,5,320,180),(0,0),(0,-5),(-1.5,1.5),'nod'),
  ((145,185,280,320),(0,0),(0,8),(2,-3),'tap')]),
 'ironico':('gatto-ironico.png',None,[
  ((80,0,295,175),(-4,6),(0,-4),(-4,2),'tilt'),
  ((20,85,165,235),(0,10),(0,-4),(-2,6),'wag')]),
 'corrotto':('gatto-corrotto-approvato.png',None,[
  ((110,15,330,185),(2,-4),(0,-3),(-2,2),'tilt'),
  ((70,60,180,190),(0,8),(0,-3),(-2,6),'coin'),
  ((250,170,420,320),(-2,6),(0,-3),(-2,2),'money')]),
 'pigro':('gatto-pigro-approvato.png',None,[
  ((105,35,295,175),(0,0),(0,8),(2,-2),'sleep'),
  ((150,125,275,250),(0,-4),(0,-6),(0,-3),'sleep')]),
 'supremo':('gatto-supremo.png',.31,[
  ((95,0,320,205),(0,0),(0,-5),(-2,2),'nod'),
  ((95,170,325,320),(0,0),(0,-3),(0,0),'breath')])
}
W,H=420,320
def crop(img,position=None):
    iw,ih=img.size
    scale=max(W/iw,H/ih)
    nw,nh=round(iw*scale),round(ih*scale)
    img=img.resize((nw,nh),Image.Resampling.LANCZOS)
    x=max(0,(nw-W)//2)
    y=max(0,(nh-H)//2) if position is None else max(0,min(nh-H,round((nh-H)*position)))
    return img.crop((x,y,x+W,y+H)).convert('RGBA')
def mask_for(bbox):
    mask=Image.new('L',(W,H),0)
    d=ImageDraw.Draw(mask)
    x1,y1,x2,y2=bbox
    d.rounded_rectangle(bbox,radius=min((x2-x1)//6,(y2-y1)//6,30),fill=255)
    return mask.filter(ImageFilter.GaussianBlur(8))
def gesture(base,layers,t):
    frame=base.copy()
    progress=math.sin(math.pi*t)  # start and end at the original pose, no looping sway
    for bbox, x_range,y_range,rot_range,_ in layers:
        mask=mask_for(bbox)
        part=Image.composite(base,Image.new('RGBA',(W,H),(0,0,0,0)),mask)
        part=part.crop(bbox)
        part_mask=mask.crop(bbox)
        dx=x_range[0]+(x_range[1]-x_range[0])*progress
        dy=y_range[0]+(y_range[1]-y_range[0])*progress
        ang=rot_range[0]+(rot_range[1]-rot_range[0])*progress
        piece=part.rotate(ang,Image.Resampling.BICUBIC,expand=False)
        pm=part_mask.rotate(ang,Image.Resampling.BICUBIC,expand=False)
        overlay=Image.new('RGBA',(W,H),(0,0,0,0))
        overlay.paste(piece,(round(bbox[0]+dx),round(bbox[1]+dy)),pm)
        frame=Image.alpha_composite(frame,overlay)
    return frame.convert('RGB')
def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source',required=True);ap.add_argument('--output',required=True)
    args=ap.parse_args()
    out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
    for cat,(original,position,layers) in CATS.items():
        img=Image.open(Path(args.source)/original)
        base=crop(img,position)
        frames=[gesture(base,layers,i/13) for i in range(14)]
        static=out/f'gatto-{cat}-static.webp'
        anim=out/f'gatto-{cat}-animato.webp'
        frames[0].save(static,quality=89,method=4)
        frames[0].save(anim,save_all=True,append_images=frames[1:],duration=90,loop=0,quality=88,method=4)
        verify=Image.open(anim)
        assert verify.size==(W,H) and verify.n_frames>=14,(cat,verify.n_frames)
        assert static.stat().st_size>10000 and anim.stat().st_size>100000,cat
        print('V23 cat',cat,'frames',verify.n_frames,'bytes',anim.stat().st_size,flush=True)
if __name__=='__main__':main()
