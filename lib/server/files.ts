import {env} from 'cloudflare:workers';
import {Operations} from './operations';
import {HttpError} from './service';
import {guardMutation, readUpload} from '../security-policy';
import {limitAccountRequest} from './request-limits';
export const mutationGuard = guardMutation;
async function access(s:Operations,org:string,ticketId:number,company?:string,write=false){if(company)await s.portalTicket(org,company,ticketId);else{await s.context(org,write?'tickets:write':undefined);await s.ticket(org,ticketId);}}
export async function fileRequest(s:Operations,request:Request,org:string,ticketId:number,fileId?:string,company?:string){
 await access(s,org,ticketId,company,request.method==='POST');
 if(request.method==='GET'){
  if(!fileId)return {files:await s.rows('SELECT id,name,size,at,visibility FROM attachments WHERE org_id=? AND ticket_id=?'+(company?" AND visibility='Customer'":'')+' ORDER BY at',org,ticketId)};
  await limitAccountRequest(s.db,s.user.id,'download');
  const lookup=()=>s.one<{object_key:string;name:string;visibility:string}>('SELECT object_key,name,visibility FROM attachments WHERE org_id=? AND ticket_id=? AND id=?',org,ticketId,fileId);
  const file=await lookup();
  if(!file||(company&&file.visibility!=='Customer'))throw new HttpError(404,'File not found.');
  if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
  const object=await env.BUCKET.get(file.object_key);if(!object)throw new HttpError(404,'File not found.');
  await access(s,org,ticketId,company);
  const current=await lookup();
  if(!current||current.object_key!==file.object_key||(company&&current.visibility!=='Customer'))throw new HttpError(404,'File not found.');
  return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(current.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }
 if(request.method!=='POST'||fileId)throw new HttpError(405,'Method not allowed.');
 await s.writableTicket(org,ticketId);mutationGuard(request);
 await limitAccountRequest(s.db,s.user.id,'upload');
 if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
 const ticket=await s.one<{version:number;company_id:string}>('SELECT version,company_id FROM tickets WHERE org_id=? AND id=?',org,ticketId);
 if(!ticket||(company&&ticket.company_id!==company))throw new HttpError(409,'Ticket changed. Reload before uploading.');
 const upload=await readUpload(request);
 const visibility=company?'Customer':upload.visibility,name=upload.name,size=upload.bytes.length,id=crypto.randomUUID(),key=org+'/'+ticketId+'/'+id;
 await s.register();await env.BUCKET.put(key,upload.bytes);
 try{
  // Repeat authorization after the external storage call. Never trust the
  // initial company, subscription, role or visibility for the final write.
  try { await access(s,org,ticketId,company,true); }
  catch(error) {
   // Initial access succeeded: revocation or reassignment during storage is a
   // stale mutation, never authorization to finish the upload. The outer catch
   // removes its new object before returning this conflict to the caller.
   if(error instanceof HttpError && [403,404].includes(error.status))throw new HttpError(409,'Ticket or access changed. Reload before uploading.');
   throw error;
  }
  const at=new Date().toISOString(),marker=crypto.randomUUID(),guard='EXISTS(SELECT 1 FROM audit_events WHERE id=?)';
  const result=await s.db.batch([
   s.stmt(`UPDATE tickets SET updated=?,version=version+1 WHERE org_id=? AND id=? AND version=? AND company_id=? AND NOT EXISTS(SELECT 1 FROM ticket_relations WHERE org_id=? AND ticket_id=? AND kind='merge') ${company?'AND EXISTS(SELECT 1 FROM customer_grants WHERE org_id=? AND company_id=? AND email=?)':''}`,at,org,ticketId,ticket.version,ticket.company_id,org,ticketId,...(company?[org,company,s.user.email]:[])),
   s.log(org,'ticket:'+ticketId,'File uploaded',null,{name,size,visibility},true,marker),
   s.stmt(`INSERT INTO attachments(id,org_id,ticket_id,name,size,object_key,at,visibility,author_id) SELECT ?,?,?,?,?,?,?,?,? WHERE ${guard}`,id,org,ticketId,name,size,key,at,visibility,s.user.id,marker)
  ]);
  if(!result[0].meta.changes)throw new HttpError(409,'Ticket or access changed. Reload before uploading.');
 }catch(e){await env.BUCKET.delete(key);throw e;}return {id};
}
