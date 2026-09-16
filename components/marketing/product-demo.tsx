'use client';
import {useEffect,useRef,useState,type ReactNode} from 'react';

export function ProductDemo({src,poster,fallback}:{src:string|null;poster?:string;fallback:ReactNode}){
 const video=useRef<HTMLVideoElement>(null),manualPause=useRef(false);
 const [playing,setPlaying]=useState(false),[failed,setFailed]=useState(false);
 const [autoPlay,setAutoPlay]=useState(false);

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

 const togglePlayback=async()=>{
  const element=video.current;if(!element)return;
  if(element.paused){manualPause.current=false;try{await element.play()}catch{setPlaying(false)}}
  else{manualPause.current=true;setAutoPlay(false);element.pause()}
 };

 if(!src||failed)return <>{fallback}</>;
 return <figure className="qv-product qv-product-video" id="product-preview" aria-label="Quevian product demo">
  <video ref={video} src={src} poster={poster} autoPlay={autoPlay} muted loop playsInline preload="metadata"
   tabIndex={0} role="button" aria-label={playing?'Pause product demo':'Play product demo'}
   onClick={()=>void togglePlayback()} onKeyDown={event=>{if(event.key===' '||event.key==='Enter'){event.preventDefault();void togglePlayback()}}}
   onPlay={()=>setPlaying(true)} onPause={()=>setPlaying(false)} onError={()=>setFailed(true)}>
   Your browser cannot play this video. Explore the product on the Product page.
  </video>
 </figure>;
}
