import {env} from 'cloudflare:workers';
import type {Enterprise} from './enterprise';
import {HttpError} from './service';
import {mutationGuard} from './files';
import {readUpload} from '../security-policy';
import {limitAccountRequest} from './request-limits';
export async function documentRequest(s:Enterprise,request:Request,org:string,kind:string,rid:string,fileId?:string,portal=false){
 if(!['company','project'].includes(kind))throw new HttpError(404,'Document collection not found.');
 const authorize=async()=>{
  if(portal){if(kind!=='company')throw new HttpError(404,'Not found.');await s.portalContext(org,rid);return rid;}
  await s.context(org,request.method==='POST'?(kind==='project'?'projects:write':'directory:write'):undefined);
  if(kind==='project'){const p=await s.one<{company_id:string}>('SELECT company_id FROM projects WHERE org_id=? AND id=?',org,rid);if(!p)throw new HttpError(404,'Project not found.');return p.company_id;}
  await s.company(org,rid);return rid;
 };
 const company=await authorize();
 const filter=portal?"d.org_id=? AND d.company_id=? AND d.visibility='Customer' AND (d.project_id IS NULL OR EXISTS(SELECT 1 FROM projects p WHERE p.org_id=d.org_id AND p.id=d.project_id AND p.visible=1))":kind==='company'?'d.org_id=? AND d.company_id=?':'d.org_id=? AND d.project_id=?';
 if(request.method==='GET'){
  if(!fileId)return {files:await s.rows(`SELECT d.id,d.name,d.size,d.at,d.visibility FROM documents d WHERE ${filter} ORDER BY d.at DESC`,org,rid)};
  await limitAccountRequest(s.db,s.user.id,'download');
  const lookup=()=>s.one<{name:string;object_key:string}>(`SELECT d.name,d.object_key FROM documents d WHERE ${filter} AND d.id=?`,org,rid,fileId);
  const file=await lookup();if(!file)throw new HttpError(404,'File not found.');
  if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
  const object=await env.BUCKET.get(file.object_key);if(!object)throw new HttpError(404,'File not found.');
  await authorize();const current=await lookup();
  if(!current||current.object_key!==file.object_key)throw new HttpError(404,'File not found.');
  return new Response(object.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(current.name),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
 }
 if(portal||request.method!=='POST'||fileId)throw new HttpError(405,'This action is unavailable.');
 mutationGuard(request);await limitAccountRequest(s.db,s.user.id,'upload');
 if(!env.BUCKET)throw new HttpError(503,'File storage is unavailable.');
 const upload=await readUpload(request),{name,visibility}=upload,size=upload.bytes.length,id=crypto.randomUUID(),key=org+'/documents/'+id;
 await s.register();await env.BUCKET.put(key,upload.bytes);
 try{
  if(await authorize()!==company)throw new HttpError(409,'The document collection changed. Reload before uploading.');
  await s.db.batch([
   s.stmt('INSERT INTO documents(id,org_id,company_id,project_id,name,size,object_key,visibility,author_id,at) VALUES(?,?,?,?,?,?,?,?,?,?)',id,org,company,kind==='project'?rid:null,name,size,key,visibility,s.user.id,new Date().toISOString()),
   s.log(org,(kind==='project'?'project:':'companies:')+rid,'Document uploaded',null,{id,name,visibility})
  ]);
 }catch(e){await env.BUCKET.delete(key);throw e}return {id};
}
