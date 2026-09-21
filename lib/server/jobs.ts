import {env} from 'cloudflare:workers';
import {TicketMail,mailProvider} from './ticket-mail';
import {importEmailFiles} from './email-files';
import {HttpError,Service} from './service';
import {createBackup,verifyBackup} from './recovery';
import {stripe,syncSubscription,billingReady} from './subscriptions';
type Runtime={DB?:D1Database;QUEVIAN_JOB_TOKEN?:string;QUEVIAN_JOBS_ENABLED?:string};
const runtime=()=>env as unknown as Runtime;
export async function authorizeJob(request:Request){
 const expected=runtime().QUEVIAN_JOB_TOKEN,provided=request.headers.get('authorization')??'';
 if(!expected||expected.length<32)throw new HttpError(503,'Background jobs are not configured.');
 const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(expected),{name:'HMAC',hash:'SHA-256'},false,['sign','verify']);
 const signature=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode('Bearer '+expected));
 if(!await crypto.subtle.verify('HMAC',key,signature,new TextEncoder().encode(provided)))throw new HttpError(401,'Unauthorized.');
}
export async function runJob(db:D1Database,name:'maintenance'|'backup'){
 const s=new Service(db,{id:'jobs-service',email:'jobs@quevian.invalid',name:'Background jobs'}),at=Date.now(),token=crypto.randomUUID();
 await s.stmt('INSERT INTO job_runs(name) VALUES(?) ON CONFLICT(name) DO NOTHING',name).run();
 const claim=await s.stmt("UPDATE job_runs SET token=?,lease_until=?,status='running',last_started=? WHERE name=? AND lease_until<?",token,at+300000,new Date(at).toISOString(),name,at).run();
 if(!claim.meta.changes)return {busy:true};
 try{
  let result:unknown;
  if(name==='backup'){await createBackup(db);result=await verifyBackup()}
  else{
   const current=await s.one<{cursor:string}>('SELECT cursor FROM job_runs WHERE name=?',name);
   const organizations=await s.rows<{id:string;user_id:string;name:string;email:string}>("SELECT o.id,m.user_id,u.name,u.email FROM organizations o JOIN memberships m ON m.org_id=o.id AND m.role='Owner' JOIN users u ON u.id=m.user_id WHERE o.id>? ORDER BY o.id LIMIT 5",current?.cursor??'');
   let failures=0;
   for(const organization of organizations){
    try{
     const actor=new TicketMail(db,{id:organization.user_id,name:organization.name,email:organization.email});
     await actor.runRecurring(organization.id);await actor.runTimedRules(organization.id);await actor.scanNotifications(organization.id);
     const pending=await actor.rows<{id:string}>("SELECT id FROM mail_outbox WHERE org_id=? AND attempts<8 AND (status IN ('pending','retry') OR (status='sending' AND updated<?)) AND updated<? ORDER BY created LIMIT 10",organization.id,new Date(at-60000).toISOString(),new Date(at-120000).toISOString());
     for(const item of pending)await actor.dispatchMail(organization.id,item.id);
     if(billingReady()){const sub=await actor.one<{subscription_id:string}>('SELECT subscription_id FROM workspace_subscriptions WHERE org_id=? AND subscription_id IS NOT NULL',organization.id);if(sub)await syncSubscription(actor,await stripe('/subscriptions/'+encodeURIComponent(sub.subscription_id)),Math.floor(at/1000))}
    }catch{failures++}
   }
   await s.stmt("UPDATE mail_attachment_imports SET status='retry',error='An interrupted import will be retried.' WHERE status='importing' AND updated<?",new Date(at-300000).toISOString()).run();
   await importEmailFiles(s,mailProvider);
   await s.stmt('UPDATE job_runs SET cursor=? WHERE name=? AND token=?',organizations.length===5?organizations.at(-1)!.id:'',name,token).run();
   if(failures)throw new Error('One or more workspace jobs failed');
   result={workspaces:organizations.length};
  }
  await s.stmt("UPDATE job_runs SET status='ok',last_completed=?,failures=0,error='',lease_until=0 WHERE name=? AND token=?",new Date().toISOString(),name,token).run();
  return {ok:true,result};
 }catch{
  await s.stmt("UPDATE job_runs SET status='failed',failures=failures+1,error='Background work failed. Review service and provider health.',lease_until=0 WHERE name=? AND token=?",name,token).run();
  console.error(JSON.stringify({event:'background_job_failed',job:name}));throw new HttpError(503,'Background work failed. It will be retried.');
 }
}
export async function health(db:D1Database){
 await db.prepare('SELECT 1 AS healthy').first();
 const jobs=(await db.prepare("SELECT name,status,last_completed,failures FROM job_runs WHERE name IN ('maintenance','backup')").all<{name:string;status:string;last_completed:string;failures:number}>()).results;
 const due=runtime().QUEVIAN_JOBS_ENABLED==='true',maintenance=jobs.find(j=>j.name==='maintenance'),backup=jobs.find(j=>j.name==='backup');
 const healthy=!due||!!(maintenance&&['ok','running'].includes(maintenance.status)&&Date.now()-Date.parse(maintenance.last_completed)<15*60000&&backup&&['ok','running'].includes(backup.status)&&Date.now()-Date.parse(backup.last_completed)<36*3600000);
 return {healthy,jobs};
}
