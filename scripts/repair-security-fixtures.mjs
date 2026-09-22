import {readFileSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';
// One-time migration of obsolete test fixtures. No production auth is replaced.
const path='tests/workspace.test.mjs';
let source=readFileSync(path,'utf8');
function replaceOnce(oldValue,newValue){assert.equal(source.split(oldValue).length,2,'Unexpected fixture source: '+oldValue.slice(0,70));source=source.replace(oldValue,newValue);}
replaceOnce("import test from 'node:test';", "import test, {beforeEach,afterEach} from 'node:test';");
replaceOnce("/^(cloudflare:workers|next\\/headers)$/", "/^(cloudflare:workers|next\\/headers|@supabase\\/ssr)$/");
replaceOnce("args.path==='cloudflare:workers'?'export const env=globalThis.__qpTestEnv;':'export async function headers()", "args.path==='cloudflare:workers'?'export const env=globalThis.__qpTestEnv;':args.path==='@supabase/ssr'?'export function createServerClient(){return {auth:{getUser:async()=>({data:{user:globalThis.__qpVerifiedUser},error:null})}}}':'export async function headers()");
replaceOnce("globalThis.__qpTestEnv={};globalThis.__qpTestHeaders=new Headers();", `globalThis.__qpTestEnv={};globalThis.__qpTestHeaders=new Headers();globalThis.__qpVerifiedUser=null;
beforeEach(()=>{
 globalThis.__qpVerifiedUser=null;globalThis.__qpTestHeaders=new Headers();
 Object.assign(globalThis.__qpTestEnv,{QUEVIAN_EMAIL_AUTH_ENABLED:'true',SUPABASE_URL:'https://fixture.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-public-key',QUEVIAN_SITE_URL:'https://queuepilot.test'});
});
afterEach(()=>{globalThis.__qpVerifiedUser=null;globalThis.__qpTestHeaders=new Headers();});
function useVerifiedAccount(db,user,{mapped=true}={}){
 const subject='fixture-subject:'+user.id;
 globalThis.__qpVerifiedUser={id:subject,email:user.email,email_confirmed_at:'2026-09-22T00:00:00Z',is_anonymous:false,user_metadata:{full_name:user.name}};
 if(mapped)db.sql.prepare('INSERT INTO auth_links(subject,user_id,created) VALUES(?,?,?) ON CONFLICT(subject) DO NOTHING').run(subject,user.id,new Date().toISOString());
}
function paidWorkspace(db,org){
 db.sql.prepare("INSERT INTO workspace_subscriptions(org_id,subscription_id,status,seats,period_end,updated) VALUES(?,?,'active',100,?,?) ON CONFLICT(org_id) DO UPDATE SET subscription_id=excluded.subscription_id,status=excluded.status,seats=excluded.seats,period_end=excluded.period_end").run(org,'sub_fixture_'+org,Math.floor(Date.now()/1000)+86400,new Date().toISOString());
}`);
function replaceTest(name,endName,replacement){const start=source.indexOf("test('"+name);const end=source.indexOf(endName,start+1);assert.ok(start>=0&&end>start,'Missing test block '+name);source=source.slice(0,start)+replacement+'\n\n'+source.slice(end);}
replaceTest('HTTP routes reject anonymous identity, cross-site mutations and untrusted tenant fields', "test('email-only dispatcher", `test('HTTP routes reject spoofed identity, unpaid access, cross-site mutations and untrusted tenant fields',async()=>{
 const {db,oa,ob,ca,ba}=await setup();try{
  globalThis.__qpTestEnv.DB=db;
  assert.equal((await http.account.GET()).status,401);
  globalThis.__qpTestHeaders=new Headers({'oai-authenticated-user-id':alice.id,'oai-authenticated-user-email':alice.email});
  assert.equal((await http.account.GET()).status,401);
  assert.equal((await acceptCurrentTerms()).status,401);
  useVerifiedAccount(db,alice);
  assert.equal((await acceptCurrentTerms()).status,200);
  const account=await http.account.GET();assert.equal(account.status,200);assert.equal((await account.json()).user.id,alice.id);
  assert.equal(account.headers.get('cache-control'),'private, no-store');
  const ctx={params:Promise.resolve({path:[oa,'tickets']})},data={title:'HTTP ticket',companyId:ca,boardId:ba};
  const request=(extra={},payload=data)=>new Request('https://queuepilot.test/api/workspace/'+oa+'/tickets',{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(payload)});
  assert.equal((await http.workspace.POST(request({'X-Quevian-Request':'1',Origin:'https://queuepilot.test'}),ctx)).status,402);
  paidWorkspace(db,oa);
  assert.equal((await http.workspace.POST(request(),ctx)).status,403);
  assert.equal((await http.workspace.POST(request({'X-Quevian-Request':'1',Origin:'https://attacker.test'}),ctx)).status,403);
  assert.equal((await http.workspace.POST(request({'X-Quevian-Request':'1','Sec-Fetch-Site':'cross-site'}),ctx)).status,403);
  assert.equal((await http.workspace.POST(request({'X-Quevian-Request':'1'},{...data,orgId:ob}),ctx)).status,400);
  assert.equal((await http.workspace.POST(request({'X-Quevian-Request':'1'},{...data,description:'x'.repeat(40000)}),ctx)).status,413);
  const created=await http.workspace.POST(request({'X-Quevian-Request':'1',Origin:'https://queuepilot.test'}),ctx);
  assert.equal(created.status,200);assert.equal((await created.json()).title,'HTTP ticket');
  const foreign=await http.workspace.GET(new Request('https://queuepilot.test/api/workspace/'+ob),{params:Promise.resolve({path:[ob]})});
  assert.equal(foreign.status,403);assert.ok(!(await foreign.text()).includes('Beta customer'));
 }finally{db.close();delete globalThis.__qpTestEnv.DB;}
});`);
replaceTest('email-only dispatcher identity can onboard, reload and access only its own workspace', 'const opsBundle=', `test('verified email account onboards, requires payment and stays isolated after reload',async()=>{
 const db=new D1();db.migrate();try{
  globalThis.__qpTestEnv.DB=db;
  const user={id:'new-owner',email:'new@example.com',name:'New Owner'};
  useVerifiedAccount(db,user,{mapped:false});
  assert.equal((await http.account.GET()).status,428);
  assert.equal((await acceptCurrentTerms()).status,200);
  const first=await (await http.account.GET()).json();
  assert.equal(first.user.id,'supabase:fixture-subject:new-owner');assert.equal(first.user.name,user.name);assert.equal(first.user.email,user.email);
  const created=await http.account.POST(new Request('https://queuepilot.test/api/account',{method:'POST',headers:{'Content-Type':'application/json','X-Quevian-Request':'1',Origin:'https://queuepilot.test'},body:JSON.stringify({action:'create',name:'New workspace',sample:false})}));
  assert.equal(created.status,200);const org=(await created.json()).id;
  useVerifiedAccount(db,user,{mapped:false});
  const again=await (await http.account.GET()).json();assert.equal(again.user.id,first.user.id);assert.equal(again.organizations[0].id,org);
  const get=()=>http.workspace.GET(new Request('https://queuepilot.test/api/workspace/'+org),{params:Promise.resolve({path:[org]})});
  assert.equal((await get()).status,402);paidWorkspace(db,org);assert.equal((await get()).status,200);
  useVerifiedAccount(db,{id:'other',email:'other@example.com',name:'Other'},{mapped:false});assert.equal((await acceptCurrentTerms()).status,200);
  assert.notEqual((await (await http.account.GET()).json()).user.id,first.user.id);assert.equal((await get()).status,403);
  globalThis.__qpVerifiedUser=null;globalThis.__qpTestHeaders=new Headers({'oai-authenticated-user-id':first.user.id,'oai-authenticated-user-email':user.email});
  assert.equal((await http.account.GET()).status,401);
 }finally{db.close();delete globalThis.__qpTestEnv.DB;}
});`);
const obsolete="globalThis.__qpTestHeaders=new Headers({'oai-authenticated-user-id':alice.id,'oai-authenticated-user-email':alice.email});assert.equal((await acceptCurrentTerms()).status,200);";
assert.equal(source.split(obsolete).length,3);
source=source.replaceAll(obsolete,"useVerifiedAccount(db,alice);paidWorkspace(db,oa);assert.equal((await acceptCurrentTerms()).status,200);");
replaceOnce("globalThis.__qpTestEnv.DB=db;globalThis.__qpTestHeaders=new Headers({'oai-authenticated-user-id':alice.id,'oai-authenticated-user-email':alice.email});\n  const get=", "globalThis.__qpTestEnv.DB=db;useVerifiedAccount(db,alice);paidWorkspace(db,oa);\n  const get=");
replaceOnce("new File(['Document body'],'guide.html')", "new File(['Document body'],'guide.txt',{type:'text/plain'})");
replaceOnce("QUEUEPILOT_AI_ORGANIZATIONS:oa});let calls=0;", "QUEUEPILOT_AI_ORGANIZATIONS:oa,QUEVIAN_AI_MONTHLY_BUDGET_CENTS:'100',QUEVIAN_AI_REQUEST_RESERVATION_CENTS:'10'});let calls=0;");
replaceOnce("['DB','QUEUEPILOT_OPENAI_KEY','QUEUEPILOT_AI_MODEL','QUEUEPILOT_AI_ORGANIZATIONS']", "['DB','QUEUEPILOT_OPENAI_KEY','QUEUEPILOT_AI_MODEL','QUEUEPILOT_AI_ORGANIZATIONS','QUEVIAN_AI_MONTHLY_BUDGET_CENTS','QUEVIAN_AI_REQUEST_RESERVATION_CENTS']");
writeFileSync(path,source);
const filePath='lib/server/files.ts';
let files=readFileSync(filePath,'utf8');
const oldAccess='  await access(s,org,ticketId,company,true);';
assert.equal(files.split(oldAccess).length,2);
files=files.replace(oldAccess,`  try { await access(s,org,ticketId,company,true); }
  catch(error) {
   // Initial access succeeded: revocation or reassignment during storage is a
   // stale mutation, never authorization to finish the upload. The outer catch
   // removes its new object before returning this conflict to the caller.
   if(error instanceof HttpError && [403,404].includes(error.status))throw new HttpError(409,'Ticket or access changed. Reload before uploading.');
   throw error;
  }`);
writeFileSync(filePath,files);
console.log('Updated verified-identity/paid-workspace fixtures and fail-closed upload-conflict handling.');
