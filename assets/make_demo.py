#!/usr/bin/env python3
"""Browser screencast (animated GIF) for ai-orders-agent.
Frames are the REAL deployed Vercel pages (ai-orders-agent.vercel.app), captured
with headless Chrome and animated as a scroll-through inside a browser chrome.
Re-capture inputs to /tmp/landing.png and /tmp/chat.png, then run this."""
from PIL import Image, ImageDraw, ImageFont
import os

VW, VH = 860, 520           # viewport (content) size
CH = 64                     # chrome height
W, H = VW, CH + VH
BAR=(237,238,241); BARLINE=(214,216,220); PILL=(255,255,255); URLINK=(70,78,90); MUT=(140,148,158)
ARIAL="/System/Library/Fonts/Supplemental/Arial.ttf"; ARIALB="/System/Library/Fonts/Supplemental/Arial Bold.ttf"
def f(p,s):
    try: return ImageFont.truetype(p,s)
    except Exception: return ImageFont.load_default()
urlfont=f(ARIAL,18); tabfont=f(ARIALB,15)

HERE=os.path.dirname(__file__)
def load(path):
    im=Image.open(path).convert("RGB"); w,h=im.size
    return im.resize((VW,int(h*VW/w)), Image.LANCZOS)
landing=load("/tmp/landing.png"); chat=load("/tmp/chat.png")

frames=[]; durations=[]
def chrome(path_label):
    img=Image.new("RGB",(W,H),(255,255,255)); d=ImageDraw.Draw(img)
    d.rectangle([0,0,W,CH],fill=BAR); d.line([(0,CH-1),(W,CH-1)],fill=BARLINE)
    for i,c in enumerate([(255,95,86),(255,189,46),(39,201,63)]): d.ellipse([22+i*24,20,38+i*24,36],fill=c)
    # address pill
    px0,px1=130,W-130; py0,py1=14,44
    d.rounded_rectangle([px0,py0,px1,py1],radius=15,fill=PILL,outline=BARLINE,width=1)
    d.ellipse([px0+16,24,px0+27,35],outline=(120,170,120),width=2)  # tiny lock
    url=f"ai-orders-agent.vercel.app{path_label}"
    d.text((px0+40,21),url,font=urlfont,fill=URLINK)
    d.text((px1-58,21),"⌄  ⟳",font=urlfont,fill=MUT)
    return img,d
def frame(page,scroll,path_label,ms):
    scroll=max(0,min(scroll,page.height-VH))
    crop=page.crop((0,int(scroll),VW,int(scroll)+VH))
    img,_=chrome(path_label); img.paste(crop,(0,CH))
    frames.append(img.convert("P",palette=Image.ADAPTIVE,colors=96)); durations.append(ms)
def ease(t): return t*t*(3-2*t)  # smoothstep
def scroll_through(page,path_label,steps,top_hold,bot_hold,step_ms):
    maxs=max(0,page.height-VH)
    frame(page,0,path_label,top_hold)
    for i in range(1,steps+1):
        frame(page,maxs*ease(i/steps),path_label,step_ms)
    frame(page,maxs,path_label,bot_hold)

scroll_through(landing,"",         15, 1300, 900, 85)
scroll_through(chat,   "/chat",    8, 1200, 1700, 95)

out=os.path.join(HERE,"demo.gif")
frames[0].save(out,save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True,disposal=2)
print(f"wrote {out} ({len(frames)} frames, {os.path.getsize(out)//1024} KB)")
