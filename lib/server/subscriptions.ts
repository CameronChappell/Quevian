import {TERMS_VERSION} from '../legal';
import {env} from 'cloudflare:workers';
import {z} from 'zod';
import {HttpError,Service} from './service';

type Settings={STRIPE_SECRET_KEY?:string;STRIPE_WEBHOOK_SECRET?:string;STRIPE_MONTHLY_PRICE_ID?:string;STRIPE_ANNUAL_PRICE_ID?:string;STRIPE_PORTAL_CONFIGURATION_ID?:string;QUEVIAN_BILLING_ENABLED?:string;QUEVIAN_LEGAL_APPROVED?:string;QUEVIAN_BILLING_REQUIRED?:string;QUEVIAN_SITE_URL?:string;STRIPE_AUTOMATIC_TAX?:string};
const settings=()=>env as unknown as Settings;
const active=['active','trialing'];
type Subscription={org_id:string;customer_id:string|null;subscription_id:string|null;status:string;seats:number;interval:string;price_id:string|null;period_end:number|null;cancel_at_period_end:number;checkout_id:string|null;checkout_expires:number|null;event_created:number};
export function billingReady(){const e=settings();return e.QUEVIAN_BILLING_ENABLED==='true'&&e.QUEVIAN_LEGAL_APPROVED==='true'&&!!(e.STRIPE_SECRET_KEY&&e.STRIPE_WEBHOOK_SECRET&&e.STRIPE_MONTHLY_PRICE_ID&&e.STRIPE_ANNUAL_PRICE_ID&&e.STRIPE_PORTAL_CONFIGURATION_ID&&e.QUEVIAN_SITE_URL)}
function site(){const url=new URL(settings().QUEVIAN_SITE_URL??'');if(url.protocol!=='https:')throw new HttpError(503,'Billing is unavailable.');return url.origin}
export async function stripe(path:string,params?:Record<string,string>,key?:string){
 if(!settings().STRIPE_SECRET_KEY)throw new HttpError(503,'Billing is not connected yet.');
 const response=await fetch('https://api.stripe.com/v1'+path,{method:params?'POST':'GET',redirect:'manual',signal:AbortSignal.timeout(15000),headers:{Authorization:'Bearer '+settings().STRIPE_SECRET_KEY,'Content-Type':'application/x-www-form-urlencoded',...(key?{'Idempotency-Key':key}:{})},...(params?{body:new URLSearchParams(params)}:{})});
 if(!response.ok)throw new HttpError(502,'The billing provider could not complete the request. Please try again.');
 return response.json() as Promise<any>;
}
async function owner(s:Service,org:string){if((await s.context(org)).role!=='Owner')throw new HttpError(403,'Only the workspace owner can manage its subscription.');}
export async function seatUsage(s:Service,org:string){return (await s.one<{n:number}>("SELECT (SELECT COUNT(*) FROM memberships m WHERE m.org_id=? AND NOT EXISTS(SELECT 1 FROM suspended_memberships x WHERE x.org_id=m.org_id AND x.user_id=m.user_id)) + (SELECT COUNT(*) FROM invitations i WHERE i.org_id=? AND i.expires>? AND NOT EXISTS(SELECT 1 FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=i.org_id AND u.email=i.email)) n",org,org,new Date().toISOString()))?.n??0}
export async function subscriptionStatus(s:Service,org:string){await s.context(org);const sub=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE org_id=?',org);return {configured:billingReady(),required:settings().QUEVIAN_BILLING_REQUIRED==='true',status:sub?.status??'not_subscribed',seats:sub?.seats??0,usedSeats:await seatUsage(s,org),interval:sub?.interval??'monthly',periodEnd:sub?.period_end??null,cancelAtPeriodEnd:!!sub?.cancel_at_period_end,hasSubscription:!!sub?.subscription_id}}
async function lease<T>(s:Service,org:string,action:()=>Promise<T>){
 const token=crypto.randomUUID(),name='billing:'+org,at=Date.now();
 await s.stmt("INSERT INTO job_runs(name) VALUES(?) ON CONFLICT(name) DO NOTHING",name).run();
 const claim=await s.stmt('UPDATE job_runs SET token=?,lease_until=? WHERE name=? AND lease_until<?',token,at+90000,name,at).run();
 if(!claim.meta.changes)throw new HttpError(409,'A billing update is in progress. Try again in a moment.');
 try{return await action()}finally{await s.stmt('UPDATE job_runs SET lease_until=0 WHERE name=? AND token=?',name,token).run()}
}
export async function startCheckout(s:Service,org:string,payload:unknown){
 await owner(s,org);if(!billingReady())throw new HttpError(503,'Subscriptions are not available yet. Contact support@quevian.com.');
 const p=z.object({interval:z.enum(['monthly','annual']),seats:z.number().int().min(1).max(500),acceptedTerms:z.literal(true)}).strict().parse(payload);
 if(p.seats<await seatUsage(s,org))throw new HttpError(400,'Choose enough seats for your active team and pending invitations.');
 return lease(s,org,async()=>{
  let row=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE org_id=?',org);
  if(row?.subscription_id&&!['canceled','incomplete_expired'].includes(row.status))throw new HttpError(409,'This workspace already has a subscription. Use Manage billing.');
  if(row?.checkout_id&&Number(row.checkout_expires)>Date.now()/1000){const session=await stripe('/checkout/sessions/'+encodeURIComponent(row.checkout_id));if(session.status==='open'){if(row.seats!==p.seats||row.interval!==p.interval)throw new HttpError(409,'An existing checkout uses a different plan. Complete it or wait for it to expire.');return {url:trustedUrl(session.url,'checkout.stripe.com')}}if(session.status==='complete')throw new HttpError(409,'Payment is being confirmed. Refresh billing in a moment.');}
  const priceId=p.interval==='annual'?settings().STRIPE_ANNUAL_PRICE_ID!:settings().STRIPE_MONTHLY_PRICE_ID!;
  const price=await stripe('/prices/'+encodeURIComponent(priceId));
  if(!price.active||price.currency!=='usd'||price.unit_amount!==(p.interval==='annual'?18000:1900)||price.recurring?.interval!==(p.interval==='annual'?'year':'month')||price.recurring?.interval_count!==1)throw new HttpError(503,'The configured plan does not match the published price. Contact support.');
  let customer=row?.customer_id;
  if(!customer){customer=(await stripe('/customers',{'email':s.user.email,'metadata[quevian_org]':org},'quevian-customer/'+org)).id;await s.stmt("INSERT INTO workspace_subscriptions(org_id,customer_id,status,updated) VALUES(?,?,'pending',?) ON CONFLICT(org_id) DO UPDATE SET customer_id=excluded.customer_id,updated=excluded.updated",org,customer,new Date().toISOString()).run()}
  const expires=Math.floor(Date.now()/1000)+1800;
  const session=await stripe('/checkout/sessions',{mode:'subscription',customer:customer!,client_reference_id:org,'line_items[0][price]':priceId,'line_items[0][quantity]':String(p.seats),'subscription_data[metadata][quevian_org]':org,'metadata[quevian_org]':org,'consent_collection[terms_of_service]':'required','billing_address_collection':'required','tax_id_collection[enabled]':'true','automatic_tax[enabled]':String(settings().STRIPE_AUTOMATIC_TAX==='true'),success_url:site()+'/app?org='+encodeURIComponent(org)+'&section=subscription&checkout=success',cancel_url:site()+'/app?org='+encodeURIComponent(org)+'&section=subscription',expires_at:String(expires)},'quevian-checkout/'+org+'/'+Math.floor(Date.now()/1800000)+'/'+p.interval+'/'+p.seats);
  await s.db.batch([s.stmt('UPDATE workspace_subscriptions SET checkout_id=?,checkout_expires=?,seats=?,interval=?,price_id=?,updated=? WHERE org_id=?',session.id,session.expires_at,p.seats,p.interval,priceId,new Date().toISOString(),org),s.log(org,'subscription','Subscription checkout requested',null,{seats:p.seats,interval:p.interval,termsVersion:TERMS_VERSION})]);
  return {url:trustedUrl(session.url,'checkout.stripe.com')};
 });
}
function trustedUrl(value:unknown,host:string){if(typeof value!=='string')throw new HttpError(502,'Billing link unavailable.');const u=new URL(value);if(u.protocol!=='https:'||u.hostname!==host||u.username||u.password)throw new HttpError(502,'Billing link unavailable.');return u.href}
export async function billingPortal(s:Service,org:string){await owner(s,org);if(!billingReady())throw new HttpError(503,'Billing is not connected.');const row=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE org_id=?',org);if(!row?.customer_id)throw new HttpError(400,'Start a subscription first.');const result=await stripe('/billing_portal/sessions',{customer:row.customer_id,configuration:settings().STRIPE_PORTAL_CONFIGURATION_ID!,return_url:site()+'/app?org='+encodeURIComponent(org)+'&section=subscription'});return {url:trustedUrl(result.url,'billing.stripe.com')}}
export async function updateSeats(s:Service,org:string,payload:unknown){
 await owner(s,org);if(!billingReady())throw new HttpError(503,'Billing is not connected.');const p=z.object({seats:z.number().int().min(1).max(500),confirm:z.literal(true)}).strict().parse(payload);
 if(p.seats<await seatUsage(s,org))throw new HttpError(400,'Suspend team access or revoke pending invitations before reducing seats.');
 return lease(s,org,async()=>{const row=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE org_id=?',org);if(!row?.subscription_id||!active.includes(row.status))throw new HttpError(409,'An active subscription is required.');const subscription=await stripe('/subscriptions/'+encodeURIComponent(row.subscription_id));if(subscription.customer!==row.customer_id||subscription.items?.data?.length!==1)throw new HttpError(409,'Subscription configuration needs review.');if(subscription.pending_update)throw new HttpError(409,'Complete the pending payment before changing seats again.');const item=subscription.items.data[0];const updated=await stripe('/subscriptions/'+encodeURIComponent(row.subscription_id),{'items[0][id]':item.id,'items[0][quantity]':String(p.seats),proration_behavior:'always_invoice',payment_behavior:'pending_if_incomplete'},'quevian-seats/'+org+'/'+row.seats+'/'+p.seats+'/'+Math.floor(Date.now()/300000));await syncSubscription(s,updated,Math.floor(Date.now()/1000));await s.log(org,'subscription','Subscription seat change requested',null,{seats:p.seats}).run();return {pending:!!updated.pending_update,...await subscriptionStatus(s,org)}});
}
export async function syncSubscription(s:Service,sub:any,eventCreated:number,event?:{id:string;type:string}){
 const row=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE customer_id=?',typeof sub.customer==='string'?sub.customer:sub.customer?.id);
 if(!row)return {ignored:true};
 if(sub.metadata?.quevian_org!==row.org_id||sub.items?.data?.length!==1)throw new HttpError(409,'Subscription ownership or plan is invalid.');
 const item=sub.items.data[0],price=item.price?.id;
 if(![settings().STRIPE_MONTHLY_PRICE_ID,settings().STRIPE_ANNUAL_PRICE_ID].includes(price)||!Number.isSafeInteger(item.quantity)||item.quantity<1||item.quantity>500)throw new HttpError(409,'Subscription plan is invalid.');
 // Old subscriptions cannot overwrite a replacement subscription on the same customer.
 if(row.subscription_id&&row.subscription_id!==sub.id&&!['canceled','incomplete_expired'].includes(row.status))return {ignored:true};
 await s.db.batch([s.stmt('UPDATE workspace_subscriptions SET subscription_id=?,status=?,seats=?,interval=?,price_id=?,period_end=?,cancel_at_period_end=?,updated=?,event_created=? WHERE org_id=? AND event_created<=?',sub.id,sub.status,item.quantity,price===settings().STRIPE_ANNUAL_PRICE_ID?'annual':'monthly',price,item.current_period_end??sub.current_period_end??null,Number(!!sub.cancel_at_period_end),new Date().toISOString(),eventCreated,row.org_id,eventCreated),...(event?[s.stmt('INSERT INTO billing_events(id,type,at) VALUES(?,?,?) ON CONFLICT(id) DO NOTHING',event.id,event.type,new Date().toISOString())]:[])]);
 return {ok:true};
}
export async function billingWebhook(request:Request,db:D1Database){
 const secret=settings().STRIPE_WEBHOOK_SECRET;if(!secret)throw new HttpError(503,'Billing webhooks are not configured.');
 const raw=await limitedText(request,262144),parts=(request.headers.get('stripe-signature')??'').split(','),timestamp=parts.find(p=>p.startsWith('t='))?.slice(2),signatures=parts.filter(p=>p.startsWith('v1=')).map(p=>p.slice(3));
 if(!timestamp||!/^\d+$/.test(timestamp)||Math.abs(Date.now()/1000-Number(timestamp))>300)throw new HttpError(401,'Invalid billing signature.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['verify']);let valid=false;
 for(const signature of signatures){if(!/^[a-f0-9]{64}$/.test(signature))continue;const bytes=Uint8Array.from(signature.match(/../g)!,x=>parseInt(x,16));if(await crypto.subtle.verify('HMAC',key,bytes,new TextEncoder().encode(timestamp+'.'+raw)))valid=true}
 if(!valid)throw new HttpError(401,'Invalid billing signature.');
 const event=z.object({id:z.string().max(200),type:z.string(),created:z.number().int(),data:z.object({object:z.any()})}).parse(JSON.parse(raw));
 const s=new Service(db,{id:'billing-service',email:'billing@quevian.invalid',name:'Billing service'});if(await s.one('SELECT id FROM billing_events WHERE id=?',event.id))return {duplicate:true};
 const object=event.data.object;let subscriptionId:string|undefined;
 if(event.type.startsWith('customer.subscription.'))subscriptionId=object.id;
 else if(event.type.startsWith('checkout.session.'))subscriptionId=typeof object.subscription==='string'?object.subscription:undefined;
 else if(event.type.startsWith('invoice.'))subscriptionId=object.parent?.subscription_details?.subscription??object.subscription;
 if(!subscriptionId)return {ignored:true};
 // Retrieve canonical provider state; a success URL or stale webhook payload never grants paid access.
 const sub=await stripe('/subscriptions/'+encodeURIComponent(subscriptionId));return syncSubscription(s,sub,event.created,event);
}
export async function limitedText(request:Request,limit:number){const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Missing request body.');let total=0;const chunks:Uint8Array[]=[];while(true){const p=await reader.read();if(p.done)break;total+=p.value.length;if(total>limit){await reader.cancel();throw new HttpError(413,'Request too large.')}chunks.push(p.value)}const bytes=new Uint8Array(total);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}return new TextDecoder().decode(bytes)}
export async function requirePaidWorkspace(s:Service,org:string){if(settings().QUEVIAN_BILLING_REQUIRED!=='true')return;const row=await s.one<Subscription>('SELECT * FROM workspace_subscriptions WHERE org_id=?',org);if(!row||!active.includes(row.status))throw new HttpError(402,'An active subscription is required to change workspace records. Your existing data remains available.');if(await seatUsage(s,org)>row.seats)throw new HttpError(402,'Your team exceeds the purchased seats. Add seats or suspend access in Settings.');}
