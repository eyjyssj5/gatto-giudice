# V20: animate the cat INSIDE each unchanged courtroom portrait.
from pathlib import Path
import argparse, math
import numpy as np, cv2
from PIL import Image

CATS={
'dolce':('gatto-dolce-approvato.png',(.50,.29,.31,.36),[(.45,.13,.052,.058),(.615,.19,.055,.062)],[(.34,.08),(.78,.065)],(.28,.68),(1.22,3.32),None),
'severo':('gatto-severo-approvato.png',(.55,.28,.32,.34),[(.49,.16,.05,.026),(.66,.205,.048,.029)],[(.38,.06),(.78,.065)],(.45,.85),(1.85,3.5),None),
'ironico':('gatto-ironico.png',(.505,.23,.31,.35),[(.46,.07,.044,.030),(.655,.12,.044,.029)],[(.35,.0),(.79,.01)],(.4,.53),(1.25,3.2),None),
'corrotto':('gatto-corrotto-approvato.png',(.55,.31,.32,.40),[(.495,.21,.041,.029),(.675,.32,.045,.027)],[(.34,.1),(.785,.13)],(.21,.59),(1.85,3.28),None),
'pigro':('gatto-pigro-approvato.png',(.525,.34,.32,.34),[(.49,.24,.045,.018),(.65,.29,.04,.019)],[(.41,.11),(.76,.15)],(.72,.57),(),None),
'supremo':('gatto-supremo.png',(.52,.39,.32,.39),[(.455,.365,.049,.035),(.658,.365,.047,.035)],[(.36,.09),(.73,.11)],None,(1.6,3.4),.31)
}
def crop(img,w,h,position=None):
  ih,iw=img.shape[:2]; s=max(w/iw,h/ih);nw,nh=round(iw*s),round(ih*s)
  img=cv2.resize(img,(nw,nh),interpolation=cv2.INTER_AREA)
  x=(nw-w)//2;y=(nh-h)//2 if position is None else round((nh-h)*position)
  y=max(0,min(nh-h,y))
  return img[y:y+h,x:x+w].copy()
def blink(t,centers):
  b=0
  for c in centers:
    d=abs(t-c)
    if d<.19:b=max(b,.5*(1+math.cos(math.pi*d/.19)))
  return b
def render(base,info,t,W=420,H=320,duration=4):
  fn,head,eyes,ears,paw,blinks,position=info
  X,Y=np.meshgrid(np.arange(W,dtype=np.float32),np.arange(H,dtype=np.float32))
  hx,hy,rx,ry=head;hx*=W;hy*=H;rx*=W;ry*=H
  weight=np.exp(-2*((X-hx)**2/rx**2+(Y-hy)**2/ry**2))
  phase=2*math.pi*t/duration;rot=.025*math.sin(phase+.35)
  dx=(2.8*math.sin(phase)+rot*(Y-hy))*weight
  dy=(-2*math.sin(phase+.6)-rot*(X-hx))*weight
  for k,(ex,ey) in enumerate(ears):
    if ey<.03:continue
    ear=np.exp(-2*(((X-ex*W)/(.075*W))**2+((Y-ey*H)/(.11*H))**2))
    dx+=(1.4 if k==0 else -1.3)*math.sin(phase*2+k*1.6)*ear
  if paw:
    px,py=paw;p=np.exp(-2*(((X-px*W)/(.13*W))**2+((Y-py*H)/(.16*H))**2))
    dy+=2.5*math.sin(phase+.8)*p
  im=cv2.remap(base,(X-dx).astype('float32'),(Y-dy).astype('float32'),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
  amount=blink(t,blinks)
  if amount>.025:
    eyelid=im.copy()
    for ex,ey,erx,ery in eyes:
      ex*=W;ey*=H;erx*=W;ery*=H
      a=max(0,int(ex-erx*1.33));b=min(W,int(ex+erx*1.33)+1)
      c=max(0,int(ey-ery*1.30));d=min(H,int(ey+ery*1.30)+1)
      if b<=a or d<=c:continue
      xs=X[c:d,a:b];ys=Y[c:d,a:b];nx=(xs-ex)/erx;ny=(ys-ey)/ery
      mask=np.clip((1.10-(nx*nx+ny*ny))*2.7,0,1)*amount
      upper=cv2.remap(im,xs.astype('float32'),np.clip(ys-ery*2.0,0,H-1).astype('float32'),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REPLICATE)
      alpha=mask[:,:,None]
      eyelid[c:d,a:b]=(eyelid[c:d,a:b]*(1-alpha)+upper*alpha).astype(np.uint8)
    im=eyelid
  return Image.fromarray(cv2.cvtColor(im,cv2.COLOR_BGR2RGB))
def main():
  p=argparse.ArgumentParser();p.add_argument('--source',required=True);p.add_argument('--output',required=True);a=p.parse_args()
  root=Path(a.source);out=Path(a.output);out.mkdir(parents=True,exist_ok=True)
  for name,info in CATS.items():
    source=cv2.imread(str(root/info[0]),cv2.IMREAD_COLOR)
    if source is None:raise RuntimeError(info[0])
    base=crop(source,420,320,info[-1])
    frames=[render(base,info,i*4/60) for i in range(60)]
    path=out/('gatto-'+name+'-animato.webp')
    frames[0].save(path,format='WEBP',save_all=True,append_images=frames[1:],quality=83,method=3,duration=67,loop=0)
    if path.stat().st_size<50000:raise RuntimeError('Empty animation '+name)
    print('OK',name,path.stat().st_size,flush=True)
if __name__=='__main__':main()
