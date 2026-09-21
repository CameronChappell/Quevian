import {env} from 'cloudflare:workers';
import {HttpError,Service} from './service';

export type Snapshot={format:'quevian-backup-v1';created:string;schema:{name:string;type:string;sql:string}[];tables:Record<string,Record<string,unknown>[]>;objects:{key:string;backupKey:string;size:number;sha256:string}[]};
const identifier=(value:string)=>{if(!/^[a-z_][a-z0-9_]*$/i.test(value))throw new Error('Invalid database identifier');return '"'+value+'"'};
export async function sha256(bytes:BufferSource){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function snapshotDatabase(db:D1Database):Promise<Snapshot>{
 const schema=(await db.prepare("SELECT name,type,sql FROM sqlite_master WHERE sql IS NOT NULL AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' AND name NOT LIKE 'd1_%' AND name NOT LIKE '__drizzle%' ORDER BY type,name").all<{name:string;type:string;sql:string}>()).results;
 const names=schema.filter(s=>s.type==='table').map(s=>s.name);
 // D1 batch queries run sequentially in a transaction: every table belongs to the same snapshot.
 const result=await db.batch(names.map(name=>db.prepare('SELECT * FROM '+identifier(name)+' LIMIT 20001')));
 const tables:Snapshot['tables']={};let count=0;
 for(let i=0;i<names.length;i++){if(result[i].results.length>20000)throw new HttpError(503,'Backup capacity requires an operator upgrade.');tables[names[i]]=result[i].results as Record<string,unknown>[];count+=result[i].results.length}
 if(count>100000)throw new HttpError(503,'Backup capacity requires an operator upgrade.');
 return {format:'quevian-backup-v1',created:new Date().toISOString(),schema,tables,objects:[]};
}
export async function createBackup(db:D1Database){
 if(!env.BUCKET)throw new HttpError(503,'Backup storage unavailable.');
 const snapshot=await snapshotDatabase(db),id=snapshot.created.replaceAll(':','-')+'-'+crypto.randomUUID(),prefix='_backups/'+id+'/';
 const keys=[...new Set([...(snapshot.tables.attachments??[]),...(snapshot.tables.documents??[])].map(x=>String(x.object_key)))];
 if(keys.length>1000)throw new HttpError(503,'File backup capacity requires an operator upgrade.');
 for(const key of keys){
  if(!key||key==='undefined'||key.startsWith('_backups/'))throw new Error('Invalid object reference');
  const object=await env.BUCKET.get(key);if(!object)throw new Error('A referenced file is missing');
  if(object.size>6*1024*1024)throw new Error('File exceeds backup capacity');
  const bytes=await object.arrayBuffer(),digest=await sha256(bytes),backupKey=prefix+'objects/'+await sha256(new TextEncoder().encode(key));
  await env.BUCKET.put(backupKey,bytes);
  snapshot.objects.push({key,backupKey,size:bytes.byteLength,sha256:digest});
 }
 const serialized=JSON.stringify(snapshot);if(new TextEncoder().encode(serialized).length>50*1024*1024)throw new Error('Database snapshot exceeds backup capacity');
 // Manifest is written last; only complete snapshots become the current recovery point.
 await env.BUCKET.put(prefix+'manifest.json',serialized,{httpMetadata:{contentType:'application/json'}});
 const info={id,created:snapshot.created,tables:Object.keys(snapshot.tables).length,rows:Object.values(snapshot.tables).reduce((n,r)=>n+r.length,0),files:snapshot.objects.length,sha256:await sha256(new TextEncoder().encode(serialized))};
 await env.BUCKET.put('_backups/latest.json',JSON.stringify(info),{httpMetadata:{contentType:'application/json'}});
 return info;
}
export async function verifyBackup(){
 if(!env.BUCKET)throw new Error('Backup storage unavailable');
 const latest=await env.BUCKET.get('_backups/latest.json');if(!latest)throw new Error('No completed backup');
 const info=JSON.parse(await latest.text()),object=await env.BUCKET.get('_backups/'+info.id+'/manifest.json');if(!object)throw new Error('Backup manifest missing');
 const text=await object.text();if(await sha256(new TextEncoder().encode(text))!==info.sha256)throw new Error('Backup manifest checksum failed');
 const snapshot=JSON.parse(text) as Snapshot;
 for(const file of snapshot.objects){const stored=await env.BUCKET.get(file.backupKey);if(!stored||stored.size!==file.size||await sha256(await stored.arrayBuffer())!==file.sha256)throw new Error('Backup file checksum failed')}
 return {...info,verified:true};
}
// An authenticated organization owner can export its business records, never provider secrets,
// login mappings, API credentials, other organizations, or global operational data.
export async function organizationExport(s:Service,org:string){
 if((await s.context(org)).role!=='Owner')throw new HttpError(403,'Only the workspace owner can export all workspace data.');
 const schema=(await s.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'").all<{name:string}>()).results;
 const excluded=new Set(['api_keys','auth_links','auth_limits','mail_outbox','mail_threads','mail_events','billing_events','job_runs','workspace_subscriptions']);
 const tables:Record<string,unknown>={};
 for(const {name} of schema){if(excluded.has(name))continue;const columns=(await s.db.prepare('PRAGMA table_info('+identifier(name)+')').all<{name:string}>()).results;if(!columns.some(c=>c.name==='org_id'))continue;const rows=await s.rows('SELECT * FROM '+identifier(name)+' WHERE org_id=? LIMIT 20001',org);if(rows.length>20000)throw new HttpError(413,'This workspace needs an assisted export. Contact support.');tables[name]=rows;}
 tables.organizations=await s.rows('SELECT id,name,created FROM organizations WHERE id=?',org);
 tables.members=await s.rows('SELECT u.id,u.name,u.email,m.role FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.org_id=?',org);
 await s.context(org,'organization:write');await s.log(org,'privacy','Workspace data exported').run();
 return Response.json({format:'quevian-workspace-export-v1',created:new Date().toISOString(),organization:org,tables,files:'Download files through their authenticated ticket, company, or project pages.'},{headers:{'Content-Disposition':'attachment; filename="quevian-workspace-export.json"','Cache-Control':'private, no-store'}});
}
