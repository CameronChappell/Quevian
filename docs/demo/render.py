"""Render the high-resolution edit locally, without uploading source captures.

Uses the same fixed framing and cursor curves as edit.jsx. Sources remain lossless through
compositing; libx264 performs the only lossy encode. Requires FFmpeg and Pillow.
"""
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'renders'
OUT.mkdir(exist_ok=True)
NAMES = ['01-queue','02-create','03-status','04-assign','05-reply','06-posted','07-updated-queue']
STATES = [(0,0,3.1),(1,3.1,6),(2,6,8.4),(3,8.4,10.8),(4,10.8,14),(5,14,17.1),(6,17.1,19.2),(0,19.2,20)]
CURSOR = [(0,2000,800),(.7,2000,800),(2.9,2380,225),(3.2,2380,225),(4.3,1460,470),(5.8,1560,1155),(6.1,1560,1155),(7.2,1790,355),(8.35,1790,355),(9.2,1800,485),(10.7,1800,485),(11.5,1750,1035),(12.8,2140,1040),(13.9,2410,1190),(14.2,2410,1190),(15.4,2200,910),(16.95,2520,40),(17.3,2520,40),(18.5,2000,800),(20,2000,800)]

def curve(points, time):
    expr = str(points[-1][1])
    for (a,v),(b,w) in reversed(list(zip(points,points[1:]))):
        # A cubic smoothstep is continuous and has zero velocity at each stop.
        u=f'(({time}-{a})/{b-a})'
        value=str(v) if v==w else f'({v}+({w-v})*{u}*{u}*(3-2*{u}))'
        expr=f'if(lt({time},{b}),{value},{expr})'
    return expr

# A small authored pointer graphic, separate from the captured app pixels.
cursor=Image.new('RGBA',(144,176),(0,0,0,0))
draw=ImageDraw.Draw(cursor)
polygon=[(8,8),(12,124),(44,96),(72,148),(96,136),(68,84),(116,80)]
draw.polygon(polygon,fill='#202124',outline='white',width=8)
cursor.resize((36,44),Image.Resampling.LANCZOS).save(OUT/'cursor.png')
args=['ffmpeg','-y','-hide_banner','-loglevel','error','-filter_complex_threads','2']
filters=[]
for i,(source,start,end) in enumerate(STATES):
    args += ['-loop','1','-framerate','60','-t',str(end-start),'-i',str(ROOT/'source'/f'{NAMES[source]}.jpg')]
    color='white' if source==0 else '0xf8f9fd' if source in (1,6) else '0x7b7c7e'
    x,w=(0,34) if source==0 else (1120,65)
    filters.append(f"[{i}:v]format=rgba,drawbox=x={x}:y=238:w={w}:h=48:color={color}:t=fill,format=yuv420p,setsar=1[v{i}]")
filters.append(''.join(f'[v{i}]' for i in range(len(STATES)))+'concat=n=8:v=1:a=0[base]')
args += ['-loop','1','-framerate','60','-i',str(OUT/'cursor.png')]
x=curve([(t,x) for t,x,y in CURSOR],'t')
y=curve([(t,y) for t,x,y in CURSOR],'t')
filters.append(f"[base][8:v]overlay=x='{x}':y='{y}':shortest=1,format=yuv420p[out]")
(OUT/'filters.txt').write_text(';\n'.join(filters))
args += ['-filter_complex_script',str(OUT/'filters.txt'),'-map','[out]','-an','-t','20','-r','60','-c:v','libx264','-preset','medium','-crf','16','-threads','4','-movflags','+faststart',str(OUT/'quevian-product-demo.mp4')]
subprocess.run(args,check=True)
for name,time in [('poster',0),('create',4.5),('status',8.8),('reply',12.5),('posted',15.4),('loop',19.9)]:
    subprocess.run(['ffmpeg','-y','-hide_banner','-loglevel','error','-ss',str(time),'-i',str(OUT/'quevian-product-demo.mp4'),'-frames:v','1',str(OUT/f'{name}.png')],check=True)
print('Rendered',OUT/'quevian-product-demo.mp4')
