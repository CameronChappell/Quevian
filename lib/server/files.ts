import {env} from 'cloudflare:workers';
import {Operations} from './operations';
import {HttpError} from './service';
export function mutationGuard(request:Request){if(request.headers.get('x-quevian-request')!=='1'&&request.headers.get('x-queuepilot-request')!=='1')throw new HttpError(403,'Refresh the page and try again.');if(request.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'Cross-site requests are not allowed.');const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)throw new HttpError(403,'Cross-site requests are not allowed.');}
async function access(s:Operations,org:string,ticketId:number,company?:string,write=false){if(company)await s.portalTicket(org,company,ticketId);else{await s.context(org,write?'tickets:write':undefined);await s.ticket(org,ticketId);}}
export async function fileRequest(s:Operations,request:Request,org:string,ticketId:number,fileId?:string,company?:string){await access(s,org,ticketId,company,request.method==='POST');if(request.method==='GET'){
 if(!fileId)return {files:await s.rows('SELECT id,name,size,at,visibility FROM attachments WHERE org_id=? AND ticket_id=?'+(company?" AND visibility='Customer'":'')+' ORDER BY at',org,ticketId)};
 const file=await s.one<{object_key:string;name:string;visibility:string}>('SELECT object_key,name,visibility FROM attachments WHERE org_id=? AND ticket_id=? AND id=?',org,ticketId,fileId);
 if(!file||(company&&file.visibility!=='Customer'))throw new HttpError(404,'File not found.');if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');const object=await env.BUCKET.get(file.object_key);if(!object)throw new HttpError(404,'File not found.');await access(s,org,ticketId,company);return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(file.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }
 if(request.method!=='POST')throw new HttpError(405,'Method not allowed.');await s.writableTicket(org,ticketId);mutationGuard(request);if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
 const ticket=await s.one<{version:number;company_id:string}>('SELECT version,company_id FROM tickets WHERE org_id=? AND id=?',org,ticketId);
 if(!ticket||(company&&ticket.company_id!==company))throw new HttpError(409,'Ticket changed. Reload before uploading.');
 const reader=request.body?.getReader();if(!reader)throw new HttpError(400,'Choose a file.');const chunks:Uint8Array[]=[];let size=0;while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>5*1024*1024+65536){await reader.cancel();throw new HttpError(413,'Files must be 5 MB or smaller.');}chunks.push(value);}const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}let form:FormData;try{form=await new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')??''},body:bytes}).formData()}catch{throw new HttpError(400,'Choose a valid file.');}
 const file=form.get('file');if(!file||typeof file==='string'||file.size>5*1024*1024||file.size===0)throw new HttpError(400,'Choose a non-empty file up to 5 MB.');const visibility=company?'Customer':form.get('visibility')==='Customer'?'Customer':'Internal',name=file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,220)||'attachment',id=crypto.randomUUID(),key=org+'/'+ticketId+'/'+id;
 await s.register();await env.BUCKET.put(key,await file.arrayBuffer());
 try{
  // Object storage can take time. Authorize and version-check the database commit,
  // so a company change, merge, or revoked grant cannot attach a file elsewhere.
  if(!company)await s.context(org,'tickets:write');
  const at=new Date().toISOString(),marker=crypto.randomUUID(),guard='EXISTS(SELECT 1 FROM audit_events WHERE id=?)';
  const result=await s.db.batch([
   s.stmt(`UPDATE tickets SET updated=?,version=version+1 WHERE org_id=? AND id=? AND version=? AND company_id=? AND NOT EXISTS(SELECT 1 FROM ticket_relations WHERE org_id=? AND ticket_id=? AND kind='merge') ${company?'AND EXISTS(SELECT 1 FROM customer_grants WHERE org_id=? AND company_id=? AND email=?)':''}`,at,org,ticketId,ticket.version,ticket.company_id,org,ticketId,...(company?[org,company,s.user.email]:[])),
   s.log(org,'ticket:'+ticketId,'File uploaded',null,{name,size:file.size,visibility},true,marker),
   s.stmt(`INSERT INTO attachments(id,org_id,ticket_id,name,size,object_key,at,visibility,author_id) SELECT ?,?,?,?,?,?,?,?,? WHERE ${guard}`,id,org,ticketId,name,file.size,key,at,visibility,s.user.id,marker)
  ]);
  if(!result[0].meta.changes)throw new HttpError(409,'Ticket or access changed. Reload before uploading.');
 }catch(e){await env.BUCKET.delete(key);throw e;}return {id};
}
