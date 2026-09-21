'use client';

import {useEffect,useState} from 'react';
import {ThemeProvider as NextThemeProvider,useTheme} from 'next-themes';
import {Moon,Sun} from 'lucide-react';
import {Toaster} from 'sonner';

export function ThemeProvider({children}:{children:React.ReactNode}) {
  return <NextThemeProvider attribute="class" storageKey="quevian-theme" defaultTheme="light" enableSystem={false} enableColorScheme={false} disableTransitionOnChange>{children}</NextThemeProvider>;
}

export function ThemeToggle({label=false}:{label?:boolean}) {
  const {theme,setTheme}=useTheme();
  const [mounted,setMounted]=useState(false);
  useEffect(()=>setMounted(true),[]);
  const dark=mounted&&theme==='dark';
  const action=dark?'Switch to light mode':'Switch to dark mode';
  return <button type="button" className={'qv-theme-toggle'+(label?' with-label':'')} onClick={()=>setTheme(dark?'light':'dark')} aria-label={action} title={action} aria-pressed={dark}>
    {dark?<Sun size={18} aria-hidden="true"/>:<Moon size={18} aria-hidden="true"/>}
    {label&&<span>{dark?'Light mode':'Dark mode'}</span>}
  </button>;
}

export function ThemeToaster() {
  const {resolvedTheme}=useTheme();
  return <Toaster theme={resolvedTheme==='dark'?'dark':'light'} position="bottom-right"/>;
}
