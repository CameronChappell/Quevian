'use client';
import {useEffect,useRef,useState} from 'react';
import {Button} from '@/components/ui/button';
import {Dialog,DialogContent,DialogHeader,DialogTitle,DialogDescription} from '@/components/ui/dialog';
import {toast} from 'sonner';

// No secret is passed to a DOM node, including hidden inputs or data attributes.
export function HiddenApiKey(){
  return <p className="rounded-md border p-3 font-mono" aria-label="API key hidden">••••••••••••••••••••••••</p>;
}

/** A new workspace key is available only to its authorized creator, once.
 * Keeping it out of markup is display privacy, not a replacement for the
 * server's authorization: the creator receives the creation response.
 */
export function OneTimeApiKey({token,onDismiss}:{token:string;onDismiss:()=>void}){
  const [copying,setCopying]=useState(false);
  const [error,setError]=useState('');
  const dismiss=useRef(onDismiss);
  dismiss.current=onDismiss;
  const active=useRef(true);
  useEffect(()=>{
    active.current=true;
    const clear=()=>{active.current=false;dismiss.current();};
    const hidden=()=>{if(document.visibilityState==='hidden')clear();};
    const timer=window.setTimeout(clear,60_000);
    window.addEventListener('pagehide',clear);
    document.addEventListener('visibilitychange',hidden);
    return()=>{
      active.current=false;
      window.clearTimeout(timer);
      window.removeEventListener('pagehide',clear);
      document.removeEventListener('visibilitychange',hidden);
    };
  },[token]);
  async function copy(){
    if(copying||!active.current)return;
    setCopying(true);setError('');
    try{
      if(!navigator.clipboard?.writeText)throw new Error('Clipboard unavailable');
      // This is the only disclosure action; it requires an explicit user click.
      await navigator.clipboard.writeText(token);
      if(!active.current)return;
      toast.success('API key copied. Store it in your password manager.');
      active.current=false;
      dismiss.current();
    }catch{
      if(active.current)setError('The key could not be copied. Allow clipboard access and try again.');
    }finally{if(active.current)setCopying(false);}
  }
  return <Dialog open onOpenChange={open=>{if(!open){active.current=false;dismiss.current();}}}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Save your API key securely</DialogTitle>
        <DialogDescription>Your key stays hidden on this page. Copy it within 60 seconds and save it in your password manager. Only its hash is stored; closing this window or switching tabs discards this copy.</DialogDescription>
      </DialogHeader>
      <HiddenApiKey/>
      {error&&<p className="form-error" role="alert">{error}</p>}
      <div className="dialog-actions">
        <Button variant="outline" type="button" onClick={()=>{active.current=false;dismiss.current();}}>Done</Button>
        <Button type="button" disabled={copying} onClick={copy}>{copying?'Copying…':'Copy key'}</Button>
      </div>
    </DialogContent>
  </Dialog>;
}
