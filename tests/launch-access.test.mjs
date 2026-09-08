import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {build} from 'esbuild';
const compiled=await build({entryPoints:['lib/server/operations.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {Operations:Service}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
class D1 {
 constructor(path=':memory:'){this.sql=new DatabaseSync(path);this.sql.exec('PRAGMA foreign_keys=ON');}
 prepare(sql){const db=this;return {args:[],bind(...args){this.args=args;return this},async all(){const stmt=db.sql.prepare(sql);const results=stmt.all(...this.args);return {results,success:true,meta:{changes:Number(db.sql.prepare('SELECT changes() n').get().n)}}},async first(){return db.sql.prepare(sql).get(...this.args)??null},async run(){const r=db.sql.prepare(sql).run(...this.args);return {results:[],success:true,meta:{changes:Number(r.changes)}}},_sql:sql};}
 async batch(stmts){this.sql.exec('BEGIN');try{const results=[];for(const s of stmts){if(/\bRETURNING\b/i.test(s._sql))results.push(await s.all());else results.push(await s.run());}this.sql.exec('COMMIT');return results}catch(e){this.sql.exec('ROLLBACK');throw e}}
 migrate(){for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())this.sql.exec(readFileSync(join('drizzle',f),'utf8'));}
 close(){this.sql.close()}
}
const alice={id:'alice',name:'Alice Owner',email:'alice@example.com'},bob={id:'bob',name:'Bob Owner',email:'bob@example.com'},eve={id:'eve',name:'Eve Viewer',email:'eve@example.com'};
async function setup(){const db=new D1();db.migrate();const a=new Service(db,alice),b=new Service(db,bob);const oa=(await a.createOrganization({name:'Alpha'})).id,ob=(await b.createOrganization({name:'Beta'})).id;const ca=(await a.directory(oa,'companies',{name:'Alpha customer'})).id,cb=(await b.directory(ob,'companies',{name:'Beta customer'})).id;const ba=(await a.workspace(oa)).boards[0].id,bb=(await b.workspace(ob)).boards[0].id;return {db,a,b,oa,ob,ca,cb,ba,bb}}
const failStatus=status=>e=>e.status===status;
// Real application services and SQL migrations; fresh isolated database per scenario.
const boardCases=[
 ['board rejects duplicate names ignoring case',[{name:'New',closed:false},{name:'new',closed:true}]],
 ['board rejects blank status names',[{name:' ',closed:false},{name:'Done',closed:true}]],
 ['board rejects an entirely closed workflow',[{name:'Closed',closed:true},{name:'Done',closed:true}]],
 ['board rejects a workflow without a closed state',[{name:'New',closed:false},{name:'Working',closed:false}]],
 ['board rejects a single status',[{name:'New',closed:false}]],
 ['board rejects more than thirty statuses',Array.from({length:31},(_,i)=>({name:'Stage '+i,closed:i===30}))],
];
for(const [name,statuses] of boardCases)test(name,async()=>{const {db,a,oa}=await setup();try{const before=(await a.workspace(oa)).boards.length;await assert.rejects(a.directory(oa,'boards',{name:'Invalid board',statuses}));assert.equal((await a.workspace(oa)).boards.length,before)}finally{db.close()}});
test('reordered custom open status becomes the default for subsequent tickets',async()=>{const {db,a,oa,ca}=await setup();try{const b=await a.directory(oa,'boards',{name:'Custom',statuses:[{name:'Review',closed:false},{name:'Queued',closed:false},{name:'Done',closed:true}]});await a.directory(oa,'boards',{name:'Custom',version:1,statuses:[{name:'Queued',closed:false},{name:'Review',closed:false},{name:'Done',closed:true}]},b.id);assert.equal((await a.createTicket(oa,{title:'Ordered',companyId:ca,boardId:b.id})).status,'Queued')}finally{db.close()}});
test('renaming an occupied status is rejected without changing its ticket',async()=>{const {db,a,oa,ca,ba}=await setup();try{const t=await a.createTicket(oa,{title:'Existing',companyId:ca,boardId:ba});const b=(await a.workspace(oa)).boards.find(x=>x.id===ba);await assert.rejects(a.directory(oa,'boards',{name:b.name,version:b.version,statuses:b.statuses.map(s=>s.name===t.status?{...s,name:'Renamed'}:s)},ba),failStatus(409));assert.equal((await a.ticket(oa,t.id)).status,t.status)}finally{db.close()}});
async function joinMember(a,db,org,role='Engineer'){const member=new Service(db,eve);await member.account();const invitation=await a.invite(org,{email:eve.email,role});await member.acceptInvitation({invitationId:invitation.id});return member}
test('accepting an invitation twice cannot duplicate membership',async()=>{const {db,a,oa}=await setup();try{const v=new Service(db,eve);await v.account();const i=await a.invite(oa,{email:eve.email,role:'Engineer'});await v.acceptInvitation({invitationId:i.id});await assert.rejects(v.acceptInvitation({invitationId:i.id}));assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM memberships WHERE org_id=? AND user_id=?').get(oa,eve.id).n,1)}finally{db.close()}});
test('pending invitation does not grant ticket visibility',async()=>{const {db,a,oa,ca,ba}=await setup();try{const t=await a.createTicket(oa,{title:'Private',companyId:ca,boardId:ba});await a.invite(oa,{email:eve.email,role:'Engineer'});await assert.rejects(new Service(db,eve).ticket(oa,t.id),failStatus(403))}finally{db.close()}});
test('engineer cannot invite additional staff',async()=>{const {db,a,oa}=await setup();try{const v=await joinMember(a,db,oa);await assert.rejects(v.invite(oa,{email:'unauthorized@example.com',role:'Viewer'}),failStatus(403))}finally{db.close()}});
test('manager cannot invite an administrator',async()=>{const {db,a,oa}=await setup();try{const v=await joinMember(a,db,oa,'Manager');await assert.rejects(v.invite(oa,{email:'admin@example.com',role:'Administrator'}),failStatus(403))}finally{db.close()}});
test('owner can invite an administrator with the intended role',async()=>{const {db,a,oa}=await setup();try{assert.equal((await (await joinMember(a,db,oa,'Administrator')).context(oa)).role,'Administrator')}finally{db.close()}});
test('existing members cannot receive another pending invitation',async()=>{const {db,a,oa}=await setup();try{await joinMember(a,db,oa);await assert.rejects(a.invite(oa,{email:eve.email,role:'Viewer'}),failStatus(409))}finally{db.close()}});
test('demotion immediately prevents ticket writes with an existing service instance',async()=>{const {db,a,oa,ca,ba}=await setup();try{const v=await joinMember(a,db,oa);const t=await v.createTicket(oa,{title:'Before demotion',companyId:ca,boardId:ba});await a.role(oa,eve.id,{role:'Viewer'});await assert.rejects(v.updateTicket(oa,String(t.id),{priority:'High',version:1}),failStatus(403));assert.equal((await a.ticket(oa,t.id)).priority,'Normal')}finally{db.close()}});
test('another organization cannot revoke a valid staff invitation',async()=>{const {db,a,b,oa,ob}=await setup();try{const i=await a.invite(oa,{email:eve.email,role:'Engineer'});await b.revokeInvite(ob,i.id);const v=new Service(db,eve);await v.account();await v.acceptInvitation({invitationId:i.id});assert.equal((await v.context(oa)).role,'Engineer')}finally{db.close()}});
async function portalSetup(){const f=await setup();const {db,a,oa,ca,ba}=f;const other=(await a.directory(oa,'companies',{name:'Second customer'})).id;const own=await a.createTicket(oa,{title:'Authorized issue',companyId:ca,boardId:ba});const foreign=await a.createTicket(oa,{title:'Other company secret',companyId:other,boardId:ba});const customer=new Service(db,{id:'customer',name:'Customer',email:'customer@example.com'});await a.grantSave(oa,{companyId:ca,email:'customer@example.com'});await customer.portalAccount();return {...f,other,own,foreign,customer}}
const portalCases=[
 ['portal ticket list excludes another company',async f=>{const r=await f.customer.portalData(f.oa,f.ca,new URL('https://test'));assert.equal(r.total,1);assert.deepEqual(r.tickets.map(t=>t.id),[f.own.id])}],
 ['portal rejects direct lookup of another company ticket',f=>assert.rejects(f.customer.portalTicket(f.oa,f.ca,f.foreign.id),failStatus(404))],
 ['portal rejects switching to an ungranted company',f=>assert.rejects(f.customer.portalData(f.oa,f.other,new URL('https://test')),failStatus(403))],
 ['portal rejects public replies on another company ticket',f=>assert.rejects(f.customer.reply(f.oa,f.foreign.id,{body:'Intrusion'},f.ca),failStatus(404))],
 ['portal rejects a forged company field during ticket creation',f=>assert.rejects(f.customer.portalCreate(f.oa,f.ca,{title:'Forged',description:'Issue',companyId:f.other}))],
 ['portal-created tickets belong to the granted company',async f=>{const t=await f.customer.portalCreate(f.oa,f.ca,{title:'Customer request',description:'Help'});assert.equal((await f.a.ticket(f.oa,t.id)).companyId,f.ca)}],
 ['portal customers cannot write staff-only notes',f=>assert.rejects(f.customer.addNote(f.oa,String(f.own.id),{body:'Staff note',version:1}),failStatus(403))],
 ['portal detail excludes internal notes and staff audit',async f=>{await f.a.addNote(f.oa,String(f.own.id),{body:'INTERNAL_ONLY',version:1});const r=await f.customer.portalTicket(f.oa,f.ca,f.own.id);assert.ok(!JSON.stringify(r).includes('INTERNAL_ONLY'));assert.equal(r.activity,undefined);assert.equal(r.notes,undefined)}],
 ['portal displays staff public replies and customer replies',async f=>{await f.a.reply(f.oa,f.own.id,{body:'Staff update'});await f.customer.reply(f.oa,f.own.id,{body:'Customer update'},f.ca);const r=await f.customer.portalTicket(f.oa,f.ca,f.own.id);assert.deepEqual(new Set(r.messages.map(m=>m.kind)),new Set(['Service team','Customer']))}],
 ['portal grant revocation immediately blocks reads and replies',async f=>{const g=(await f.a.grants(f.oa)).grants[0];await f.a.grantRevoke(f.oa,g.id);await assert.rejects(f.customer.portalTicket(f.oa,f.ca,f.own.id),failStatus(403));await assert.rejects(f.customer.reply(f.oa,f.own.id,{body:'Late'},f.ca),failStatus(403))}],
 ['portal grants cannot target another organization company',f=>assert.rejects(f.a.grantSave(f.oa,{companyId:f.cb,email:'customer@example.com'}),failStatus(400))],
 ['portal cannot enumerate staff workspace data',f=>assert.rejects(f.customer.workspace(f.oa),failStatus(403))],
 ['portal account lists only grants matching its email',async f=>{await f.a.grantSave(f.oa,{companyId:f.other,email:'someoneelse@example.com'});const r=await f.customer.portalAccount();assert.deepEqual(r.grants.map(g=>g.companyId),[f.ca])}],
 ['visible projects from another company stay out of the portal',async f=>{await f.a.projectSave(f.oa,{name:'Other shared project',companyId:f.other,ownerId:null,status:'Planning',due:'',estimatedHours:0,visible:true});const r=await f.customer.portalData(f.oa,f.ca,new URL('https://test'));assert.equal(r.projects.length,0)}],
];
for(const [name,check] of portalCases)test(name,async()=>{const f=await portalSetup();try{await check(f)}finally{f.db.close()}});
const tenantCases=[
 ['cross-tenant ticket update leaves original intact',async f=>{const t=await f.b.createTicket(f.ob,{title:'Foreign secret',companyId:f.cb,boardId:f.bb});await assert.rejects(f.a.updateTicket(f.ob,String(t.id),{title:'Changed',version:1}),failStatus(403));assert.equal((await f.b.ticket(f.ob,t.id)).title,'Foreign secret')}],
 ['cross-tenant board editing is forbidden',async f=>{const board=(await f.b.workspace(f.ob)).boards[0];await assert.rejects(f.a.directory(f.ob,'boards',{name:'Changed',statuses:board.statuses,version:1},board.id),failStatus(403))}],
 ['cross-tenant company editing is forbidden',f=>assert.rejects(f.a.directory(f.ob,'companies',{name:'Changed',version:1},f.cb),failStatus(403))],
 ['contact from another company in the same organization is rejected',async f=>{const c=(await f.a.directory(f.oa,'companies',{name:'Other'})).id,contact=(await f.a.directory(f.oa,'contacts',{name:'Other contact',companyId:c})).id;await assert.rejects(f.a.createTicket(f.oa,{title:'Mismatch',companyId:f.ca,boardId:f.ba,contactId:contact}),failStatus(400))}],
 ['cross-tenant assignee cannot be added by ticket update',async f=>{const t=await f.a.createTicket(f.oa,{title:'Assignment',companyId:f.ca,boardId:f.ba});await assert.rejects(f.a.updateTicket(f.oa,String(t.id),{assigneeId:bob.id,version:1}),failStatus(400))}],
 ['cross-tenant portal grant does not authorize a matching ticket number',async f=>{const t=await f.b.createTicket(f.ob,{title:'Secret',companyId:f.cb,boardId:f.bb});const customer=new Service(f.db,{id:'visitor',name:'Visitor',email:'visitor@example.com'});await f.a.grantSave(f.oa,{companyId:f.ca,email:'visitor@example.com'});await assert.rejects(customer.portalTicket(f.ob,f.cb,t.id),failStatus(403))}],
 ['organization account list does not reveal other owners organizations',async f=>{assert.deepEqual((await f.a.account()).organizations.map(o=>o.id),[f.oa])}],
 ['forged role input cannot create an owner invitation',f=>assert.rejects(f.a.invite(f.oa,{email:eve.email,role:'Owner'}))],
];
for(const [name,check] of tenantCases)test(name,async()=>{const f=await setup();try{await check(f)}finally{f.db.close()}});
