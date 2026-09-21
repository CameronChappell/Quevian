'use client';
import {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Checkbox} from '@/components/ui/checkbox';
import {Input} from '@/components/ui/input';
import {RadioGroup,RadioGroupItem} from '@/components/ui/radio-group';
import {toast} from 'sonner';
import {api,message,Loading,ErrorState} from './common';
import {useRemote} from './module-common';
type Status={configured:boolean;required:boolean;status:string;seats:number;usedSeats:number;interval:string;periodEnd:number|null;cancelAtPeriodEnd:boolean;hasSubscription:boolean};
export function SubscriptionSettings({org,owner}:{org:string;owner:boolean}){
 const url='/api/workspace/'+org+'/subscription',{data,error,reload}=useRemote<Status>(url),[interval,setInterval]=useState('monthly'),[seats,setSeats]=useState(''),[consent,setConsent]=useState(false),[busy,setBusy]=useState(false);
 const currentSubscription=!!data?.hasSubscription&&!['canceled','incomplete_expired'].includes(data.status);
 const quantity=Number(seats||Math.max(1,data?.usedSeats??1,data?.seats??0));
 async function act(action:string,payload:unknown){setBusy(true);try{const result=await api<{url?:string;pending?:boolean}>(url+'/'+action,'POST',payload);if(result.url){window.location.assign(result.url);return}await reload();toast.success(result.pending?'Complete the payment in Manage billing to activate the new seats.':'Subscription updated.')}catch(e){toast.error(message(e))}finally{setBusy(false)}}
 return <section className="settings-panel"><h2>Subscription</h2>{error?<ErrorState error={error} retry={reload}/>:!data?<Loading/>:<>
 <p>Quevian Workspace · {data.usedSeats} active staff seats and pending invitations. Customer-only portal accounts do not use staff seats.</p>
 {!data.configured?<p className="account-notice">Online subscriptions are being connected. You have not been charged. For billing questions, contact <a href="mailto:support@quevian.com">support@quevian.com</a>.</p>:<>
 <p><strong>{data.status.replaceAll('_',' ')}</strong>{data.hasSubscription&&<> · {data.seats} seats · {data.interval==='annual'?'Annual':'Monthly'} billing</>}</p>
 {data.periodEnd&&<p>{data.cancelAtPeriodEnd?'Subscription ends':'Current billing period ends'} {new Date(data.periodEnd*1000).toLocaleDateString()}.</p>}
 {['past_due','unpaid','incomplete','paused'].includes(data.status)&&<p className="form-error">Your subscription needs attention. Open Manage billing to check payment details.</p>}
 {owner&&<>{data.hasSubscription&&<Button disabled={busy} onClick={()=>act('portal',{})}>Manage billing</Button>}
 <form className="qp-form" onSubmit={e=>{e.preventDefault();if(!consent||busy)return;act(currentSubscription?'seats':'checkout',currentSubscription?{seats:quantity,confirm:true}:{seats:quantity,interval,acceptedTerms:true})}}>
 {!currentSubscription&&<RadioGroup value={interval} onValueChange={setInterval} aria-label="Billing frequency"><label><RadioGroupItem value="monthly"/>Monthly — $19 per staff seat</label><label><RadioGroupItem value="annual"/>Annual — $180 per staff seat</label></RadioGroup>}
 <label htmlFor="subscription-seats">Staff seats</label><Input id="subscription-seats" type="number" min={Math.max(1,data.usedSeats)} max={500} step={1} value={seats||quantity} onChange={e=>setSeats(e.target.value)} disabled={busy}/>
 <p>{currentSubscription?'Seat changes are prorated. Increases can require immediate payment; reductions cannot go below active staff and pending invitations.':`${new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(quantity*(interval==='annual'?180:19))} ${interval==='annual'?'per year, paid upfront':'per month'}, before applicable taxes. Your total is shown before payment.`}</p>
 <label className="checkbox-label"><Checkbox checked={consent} onCheckedChange={v=>setConsent(v===true)}/><span>{currentSubscription?'I authorize this seat change and any resulting prorated charge.':<>I agree to the <a href="/terms" target="_blank" rel="noreferrer">terms</a> and authorize recurring billing at the price and interval shown above and at checkout until canceled. I have reviewed the <a href="/billing-policy" target="_blank" rel="noreferrer">cancellation and refund information</a>.</>}</span></label>
 <Button disabled={busy||!consent||!Number.isInteger(quantity)||quantity<Math.max(1,data.usedSeats)||quantity>500||(currentSubscription&&quantity===data.seats)}>{busy?'Opening…':currentSubscription?'Update seats':'Continue to secure checkout'}</Button>
 </form></>}
 {!owner&&<p>Only the workspace owner can change billing.</p>}
 </>}
 <Button variant="ghost" onClick={()=>reload()} disabled={busy}>Refresh subscription</Button>
 </>}</section>;
}
