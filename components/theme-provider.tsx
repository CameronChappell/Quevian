'use client';

import {useEffect,useRef,useState} from 'react';
import {ThemeProvider as NextThemeProvider,useTheme} from 'next-themes';
import {Moon,Sun} from 'lucide-react';
import {Toaster} from 'sonner';

export function ThemeProvider({children}:{children:React.ReactNode}) {
  return <NextThemeProvider attribute="class" storageKey="quevian-theme" defaultTheme="light" enableSystem={false} enableColorScheme={false}>{children}</NextThemeProvider>;
}

export function ThemeToggle({label=false}:{label?:boolean}) {
  const {theme,setTheme}=useTheme();
  const [mounted,setMounted]=useState(false);
  const transitionTimer=useRef<ReturnType<typeof setTimeout>|null>(null);
  useEffect(()=>{
    setMounted(true);
    return ()=>{
      if(transitionTimer.current)clearTimeout(transitionTimer.current);
      document.documentElement.classList.remove('qv-theme-changing');
    };
  },[]);
  const dark=mounted&&theme==='dark';
  const action=dark?'Switch to light mode':'Switch to dark mode';
  function toggleTheme() {
    if(transitionTimer.current)clearTimeout(transitionTimer.current);
    const root=document.documentElement;
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      root.classList.add('qv-theme-changing');
      // Apply the transition rules before next-themes changes the colors.
      void window.getComputedStyle(document.body).backgroundColor;
      transitionTimer.current=setTimeout(()=>root.classList.remove('qv-theme-changing'),350);
    } else root.classList.remove('qv-theme-changing');
    setTheme(dark?'light':'dark');
  }
  return <button type="button" className={'qv-theme-toggle'+(label?' with-label':'')} onClick={toggleTheme} aria-label={action} title={action} aria-pressed={dark}>
    <span className="qv-theme-icons" aria-hidden="true"><Moon size={18} className="qv-theme-moon"/><Sun size={18} className="qv-theme-sun"/></span>
    {label&&<span>{dark?'Light mode':'Dark mode'}</span>}
  </button>;
}

export function ThemeToaster() {
  const {resolvedTheme}=useTheme();
  return <Toaster theme={resolvedTheme==='dark'?'dark':'light'} position="bottom-right"/>;
}
