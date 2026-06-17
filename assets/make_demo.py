#!/usr/bin/env python3
"""Animated GIF for ai-orders-agent. Terminal output is REAL output captured
from the running dev server (/api/stats, /api/search, /api/mcp tools/list)."""
from PIL import Image, ImageDraw, ImageFont
import os
W,H=1200,700
BG=(13,17,23); FG=(201,209,217); MUT=(139,148,158); GRN=(63,185,80)
CYN=(88,166,255); YEL=(210,153,34); RED=(248,81,73); PUR=(188,140,255); CHROME=(22,27,34)
MENLO="/System/Library/Fonts/Menlo.ttc"; ARIALB="/System/Library/Fonts/Supplemental/Arial Bold.ttf"; ARIAL="/System/Library/Fonts/Supplemental/Arial.ttf"
def f(p,s,i=0):
    try: return ImageFont.truetype(p,s,index=i)
    except Exception: return ImageFont.truetype(p,s)
mono=f(MENLO,19); mono_s=f(MENLO,17); title=f(ARIALB,44); subt=f(ARIAL,24); small=f(ARIAL,18)
frames=[]; durations=[]
def base():
    img=Image.new("RGB",(W,H),BG); d=ImageDraw.Draw(img)
    d.rectangle([0,0,W,44],fill=CHROME)
    for i,c in enumerate([(255,95,86),(255,189,46),(39,201,63)]): d.ellipse([22+i*26,15,36+i*26,29],fill=c)
    return img,d
def wt(d,t): w=d.textlength(t,font=mono_s); d.text(((W-w)/2,14),t,font=mono_s,fill=MUT)
def add(img,ms): frames.append(img.convert("P",palette=Image.ADAPTIVE,colors=128)); durations.append(ms)
def card(lines,ms=1600,tt="ai-orders-agent"):
    img,d=base(); wt(d,tt); total=sum(h for *_,h in lines); y=(H+44-total)/2
    for text,fnt,col,lh in lines:
        w=d.textlength(text,font=fnt); d.text(((W-w)/2,y),text,font=fnt,fill=col); y+=lh
    add(img,ms)
def term(tt,lines,typing=None,cursor=True,y0=66):
    img,d=base(); wt(d,tt); y=y0
    for text,col in lines: d.text((40,y),text,font=mono,fill=col); y+=27
    if typing is not None:
        text,col=typing; d.text((40,y),text,font=mono,fill=col)
        if cursor:
            cx=40+d.textlength(text,font=mono); d.rectangle([cx+2,y+3,cx+11,y+23],fill=FG)
    return img
def type_line(tt,prev,prefix,body,col,step=3,ms=24,y0=66):
    i=0
    while i<=len(body): add(term(tt,prev,typing=(prefix+body[:i],col),y0=y0),ms); i+=step
    add(term(tt,prev,typing=(prefix+body,col),cursor=False,y0=y0),250)
def reveal(tt,head,outlines,hold=1600):
    acc=list(head)
    for ln in outlines: acc.append(ln); add(term(tt,acc,cursor=False),140)
    add(term(tt,acc,cursor=False),hold)
    return acc

# A title
card([("ai-orders-agent",title,FG,66),("Agent-facing API + MCP for the AI Court Orders dataset",subt,CYN,48),
      ("",subt,FG,16),("github.com/legalrealist/ai-orders-agent",small,MUT,30)],1600)
# B stats (real)
T="zsh — ai-orders-agent"
type_line(T,[],"$ ","npm run dev   # Next.js → http://localhost:3000",FG,step=4,ms=20)
h=[("$ npm run dev   # Next.js → http://localhost:3000",FG)]
type_line(T,h,"$ ","curl localhost:3000/api/stats",FG)
h=[("$ npm run dev   # Next.js → http://localhost:3000",FG),("$ curl localhost:3000/api/stats",FG)]
reveal(T,h,[
 ("{",FG),
 ('  "total": 929,',FG),
 ('  "by_type": { "Judicial Opinion": 754, "Standing Order": 108, ... },',FG),
 ('  "by_consequence": { "sanctions_attorney": 297, "warning": 293,',FG),
 ('                      "sanctions_party": 102 },',FG),
 ('  "with_pdf": 631, "date_range": ["2023-05-30", "2026-05-15"]',FG),
 ("}",FG),
])
# C search (real hit)
type_line(T,[],"$ ","curl 'localhost:3000/api/search?q=immigration&limit=1'",FG,step=4,ms=20)
hs=[("$ curl 'localhost:3000/api/search?q=immigration&limit=1'",FG)]
reveal(T,hs,[
 ("[ {",FG),
 ('   "date": "2026-04-07", "court": "9th Cir.", "consequence": "warning",',FG),
 ('   "name": "Judge Danielle Jo Forrest",',FG),
 ('   "summary": "Kumar v. Bondi ... included what \\"appear[ed]\\" to be a',FG),
 ('       \\"hallucinated block quotation\\" ... court warned sanctions',FG),
 ('       could follow for fabricated authority."',FG),
 ("} ]",FG),
])
# D MCP
type_line(T,[],"$ ","curl -XPOST localhost:3000/api/mcp -d '{\"method\":\"tools/list\"}'",FG,step=4,ms=18)
hm=[("$ curl -XPOST localhost:3000/api/mcp -d '{\"method\":\"tools/list\"}'",FG)]
reveal(T,hm,[
 ('{ "tools": [ "search_orders", "list_orders", "get_order", "get_text",',GRN),
 ('             "get_pdf", "facets", "stats", "bar_opinions" ] }',GRN),
 ("",FG),
 ("→ add the /api/mcp URL as a custom connector in Claude Desktop / claude.ai",CYN),
], hold=2000)
# E end
card([("REST · OpenAPI · MCP — one dataset, three agent surfaces",subt,FG,48),
      ("tool definitions shared, so the surfaces never drift",small,MUT,40),
      ("",subt,FG,12),
      ("github.com/legalrealist/ai-orders-agent",small,CYN,30)],2400)

out=os.path.join(os.path.dirname(__file__),"demo.gif")
frames[0].save(out,save_all=True,append_images=frames[1:],duration=durations,loop=0,optimize=True,disposal=2)
print(f"wrote {out} ({len(frames)} frames, {os.path.getsize(out)//1024} KB)")
