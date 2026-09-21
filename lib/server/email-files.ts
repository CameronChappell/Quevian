import {env} from 'cloudflare:workers';
import {HttpError,Service} from './service';

export const EMAIL_FILE_LIMIT=5*1024*1024;
const allowed=/\.(pdf|png|jpe?g|gif|webp|txt|log|csv|docx|xlsx|pptx)$/i;
export const safeFileName=(name:string)=>name.replace(/[\x00-\x1f\x7f/\\]/g,'_').slice(0,220)||'attachment';
type Provider=(path:string,init?:RequestInit)=>Promise<any>;
type Import={id:string;provider_id:string;attachment_id:string;org_id:string;ticket_id:number;company_id:string;author_id:string;name:string;size:number;status:string;attempts:number};

export async function queueEmailFiles(s:Service,providerId:string,files:unknown[],authorId:string){
 const receipt=await s.one<{org_id:string;ticket_id:number;company_id:string}>('SELECT m.org_id,m.ticket_id,t.company_id FROM mail_inbound m JOIN tickets t ON t.org_id=m.org_id AND t.id=m.ticket_id WHERE provider_id=?',providerId);
 if(!receipt)return;
 let total=0;
 for(const [i,value] of files.slice(0,25).entries()){
  if(!value||typeof value!=='object')continue;
  const f=value as Record<string,unknown>;
  if(typeof f.id!=='string'||!f.id||f.id.length>150)continue;
  const name=safeFileName(typeof f.filename==='string'?f.filename:'attachment'),size=Number(f.size??0);
  total+=Number.isFinite(size)&&size>0?size:0;
  const reason=i>=10?'Maximum 10 attachments per email.':!allowed.test(name)?'This file type is not imported.':!Number.isSafeInteger(size)||size<=0||size>EMAIL_FILE_LIMIT?'File must be between 1 byte and 5 MB.':total>20*1024*1024?'Email attachments exceed 20 MB.':'';
  await s.stmt('INSERT INTO mail_attachment_imports(id,provider_id,attachment_id,org_id,ticket_id,company_id,author_id,name,size,status,updated,error) VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(provider_id,attachment_id) DO NOTHING',crypto.randomUUID(),providerId,f.id,receipt.org_id,receipt.ticket_id,receipt.company_id,authorId,name,Number.isSafeInteger(size)&&size>=0?size:0,reason?'skipped':'pending',new Date().toISOString(),reason).run();
 }
}

export async function importEmailFiles(s:Service,provider:Provider,providerId?:string){
 if(!env.BUCKET)return;
 const rows=await s.rows<Import>("SELECT * FROM mail_attachment_imports WHERE status IN ('pending','retry') AND attempts<8"+(providerId?' AND provider_id=?':' AND updated<?')+' ORDER BY updated LIMIT 10',providerId??new Date(Date.now()-300000).toISOString());
 for(const row of rows){
  // A conditional claim prevents concurrent webhook and scheduler workers from importing twice.
  const at=new Date().toISOString();
  const claim=await s.stmt("UPDATE mail_attachment_imports SET status='importing',attempts=attempts+1,updated=? WHERE id=? AND status IN ('pending','retry')",at,row.id).run();
  if(!claim.meta.changes)continue;
  const key=row.org_id+'/mail/'+row.id;
  try{
   const visited=new Set<number>();while(true){if(visited.has(row.ticket_id))throw new HttpError(409,'Invalid ticket merge chain.');visited.add(row.ticket_id);const merge=await s.one<{target_id:number}>("SELECT target_id FROM ticket_relations WHERE org_id=? AND ticket_id=? AND kind='merge'",row.org_id,row.ticket_id);if(!merge)break;row.ticket_id=merge.target_id;}
   const ticket=await s.one<{company_id:string;version:number}>('SELECT company_id,version FROM tickets WHERE org_id=? AND id=?',row.org_id,row.ticket_id);
   if(!ticket||ticket.company_id!==row.company_id)throw new HttpError(409,'Ticket company changed.');
   const data=await provider('/emails/receiving/'+encodeURIComponent(row.provider_id)+'/attachments/'+encodeURIComponent(row.attachment_id));
   const url=new URL(data.download_url);
   // Provider-issued, HTTPS-only object URLs. No credentials, redirects or private-network targets.
   if(url.protocol!=='https:'||url.username||url.password||url.port||!(/(^|\.)resend\.com$/.test(url.hostname)||/\.s3(?:[.-][a-z0-9-]+)?\.amazonaws\.com$/.test(url.hostname)))throw new HttpError(502,'Attachment download host is not supported.');
   const response=await fetch(url,{redirect:'manual',signal:AbortSignal.timeout(15000)});
   if(!response.ok||!response.body)throw new Error('Attachment unavailable');
   const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0;
   while(true){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>EMAIL_FILE_LIMIT||size>row.size){await reader.cancel();throw new HttpError(413,'Attachment exceeds its declared size.')}chunks.push(part.value)}
   if(size!==row.size)throw new Error('Attachment size mismatch');
   const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
   await env.BUCKET.put(key,bytes);
   // Same-company check at the commit boundary; imported files are always customer-visible downloads.
   const result=await s.db.batch([
    s.stmt("INSERT INTO attachments(id,org_id,ticket_id,name,size,object_key,at,visibility,author_id) SELECT ?,?,?,?,?,?,?,'Customer',? WHERE EXISTS(SELECT 1 FROM tickets WHERE org_id=? AND id=? AND company_id=? AND NOT EXISTS(SELECT 1 FROM ticket_relations WHERE org_id=? AND ticket_id=? AND kind='merge')) ON CONFLICT(id) DO NOTHING",row.id,row.org_id,row.ticket_id,row.name,size,key,at,row.author_id,row.org_id,row.ticket_id,row.company_id,row.org_id,row.ticket_id),
    s.stmt("UPDATE mail_attachment_imports SET status='imported',error='',ticket_id=?,updated=? WHERE id=? AND EXISTS(SELECT 1 FROM attachments WHERE id=?)",row.ticket_id,at,row.id,row.id)
   ]);
   if(!result[1].meta.changes){await env.BUCKET.delete(key);throw new HttpError(409,'Ticket changed during import.')}
  }catch(e){await s.stmt("UPDATE mail_attachment_imports SET status=?,error=?,updated=? WHERE id=?",(e instanceof HttpError&&e.status===409)||row.attempts>=7?'review':'retry',e instanceof HttpError?e.message:'Attachment import failed; a saved retry is available.',new Date().toISOString(),row.id).run()}
 }
}

export async function selectedEmailFiles(s:Service,org:string,ticketId:number,ids:string[]){
 const selected=[];let total=0;
 for(const id of [...new Set(ids)].sort()){
  const file=await s.one<{id:string;name:string;size:number;object_key:string}>("SELECT id,name,size,object_key FROM attachments WHERE org_id=? AND ticket_id=? AND id=? AND visibility='Customer'",org,ticketId,id);
  if(!file)throw new HttpError(400,'Choose only customer-visible files from this ticket.');
  if(!allowed.test(file.name)||file.size>EMAIL_FILE_LIMIT)throw new HttpError(400,'This attachment cannot be emailed.');
  total+=file.size;if(total>10*1024*1024)throw new HttpError(400,'Selected email attachments exceed 10 MB.');
  selected.push(file);
 }
 return selected;
}

export async function hydrateEmailFiles(payload:string){
 const data=JSON.parse(payload),files=data._files??[];delete data._files;
 if(!files.length)return JSON.stringify(data);
 if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
 data.attachments=[];
 for(const file of files){
  const object=await env.BUCKET.get(file.object_key);if(!object||object.size!==file.size)throw new HttpError(409,'A selected attachment is unavailable.');
  const bytes=new Uint8Array(await object.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  data.attachments.push({filename:file.name,content:btoa(binary)});
 }
 return JSON.stringify(data);
}
