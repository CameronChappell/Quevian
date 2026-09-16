'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';
import {Pause,Play} from 'lucide-react';

export function ProductDemo({src,poster,fallback}:{src:string|null;poster?:string;fallback:ReactNode}){
 const video=useRef<HTMLVideoElement>(null),manualPause=useRef(false);
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const [autoPlay,setAutoPlay]=useState(false),[playError,setPlayError]=useState(false);

 useEffect(()=>{
  const element=video.current;
  if(!src||!element||failed)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false;
  element.muted=true;
  const update=()=>{
   const allowed=!motion.matches&&visible&&!document.hidden&&!manualPause.current;
   setAutoPlay(allowed);
   if(allowed){
    void element.play().catch(()=>setPlaying(false));
   }else element.pause();
  };
  const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;update()},{threshold:0.2});
  observer.observe(element);
  motion.addEventListener('change',update);
  document.addEventListener('visibilitychange',update);
  update();
  return()=>{observer.disconnect();motion.removeEventListener('change',update);document.removeEventListener('visibilitychange',update);element.pause()};
 },[src,failed]);

 if(!src||failed)return <>{fallback}</>;
 return <figure className="qv-product qv-product-video" id="product-preview" aria-label="Quevian product demo">
  <video ref={video} src={src} poster={poster} autoPlay={autoPlay} muted loop playsInline preload="metadata"
   aria-describedby="qv-product-demo-description" onPlay={()=>{setPlaying(true);setPlayError(false)}} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)}>
   Your browser cannot play this video. Explore the product on the Product page.
  </video>
  <figcaption className="qv-video-caption">
   <span id="qv-product-demo-description">20-second tour: create, assign, and update a ticket.</span>
   <button type="button" className="qv-video-control" onClick={async()=>{
    const element=video.current;if(!element)return;
    if(element.paused){manualPause.current=false;try{await element.play()}catch{setPlayError(true)}}
    else{manualPause.current=true;setAutoPlay(false);element.pause()}
   }} aria-label={playing?'Pause product demo':'Play product demo'}>{playing?<Pause size={16}/>:<Play size={16}/>}<span>{playing?'Pause':'Play demo'}</span></button>
  </figcaption>
  {playError&&<p className="qv-video-message" role="status">Playback couldn’t start. <a href={src}>Open the demo video</a>.</p>}
 </figure>;
}
