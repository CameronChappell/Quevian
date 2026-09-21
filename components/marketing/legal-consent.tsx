'use client';
import {useState} from 'react';
import {TERMS_VERSION,PRIVACY_VERSION} from '@/lib/legal';
export function LegalConsent({next}:{next:string}){
 const [terms,setTerms]=useState(false),[privacy,setPrivacy]=useState(false),[adult,setAdult]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 return <form className="qv-consent-form" onSubmit={async e=>{e.preventDefault();if(!terms||!privacy||!adult||busy)return;setBusy(true);setError('');try{const r=await fetch('/api/legal',{method:'POST',headers:{'Content-Type':'application/json','X-Quevian-Request':'1'},body:JSON.stringify({acceptedTerms:terms,acknowledgedPrivacy:privacy,adultAndAuthorized:adult,termsVersion:TERMS_VERSION,privacyVersion:PRIVACY_VERSION})});if(!r.ok){const d=await r.json() as {error?:string};throw new Error(d.error??'Unable to save your choice.')}window.location.assign(next)}catch(e){setError(e instanceof Error?e.message:'Please try again.');setBusy(false)}}}>
  <fieldset disabled={busy}><legend>Review before continuing</legend>
   <label className="qv-consent-check"><input type="checkbox" required checked={terms} onChange={e=>setTerms(e.target.checked)}/><span>I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms & conditions</a> and <a href="/acceptable-use" target="_blank" rel="noreferrer">Acceptable use policy</a>.</span></label>
   <label className="qv-consent-check"><input type="checkbox" required checked={privacy} onChange={e=>setPrivacy(e.target.checked)}/><span>I have read the <a href="/privacy" target="_blank" rel="noreferrer">Privacy policy</a>, including <a href="/cookies" target="_blank" rel="noreferrer">browser storage</a> and backup retention. This is an acknowledgment, not consent to marketing.</span></label>
   <label className="qv-consent-check"><input type="checkbox" required checked={adult} onChange={e=>setAdult(e.target.checked)}/><span>I am at least 18 and authorized to use this account and act for any organization I represent.</span></label>
   <p>We record your account, the policy versions, and the time of acceptance. This does not start a subscription or authorize payment.</p>
   {error&&<p className="qv-auth-error" role="alert">{error}</p>}
   <button className="qv-button" disabled={busy||!terms||!privacy||!adult}>{busy?'Saving…':'Agree and continue'}</button>
  </fieldset>
 </form>
}
