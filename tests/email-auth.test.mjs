import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
const state={env:{},headers:new Headers(),user:null,calls:[]};globalThis.__emailAuthTest=state;
const fake={getUser:async()=>({data:{user:state.user},error:null}),signUp:async p=>{state.calls.push(['signup',p]);return {data:{user:state.user},error:null}},signInWithPassword:async p=>{state.calls.push(['login',p]);return {data:{user:state.user},error:state.loginError??null}},resetPasswordForEmail:async()=>({error:null}),resend:async()=>({error:null}),verifyOtp:async p=>{state.calls.push(['verify',p]);return {error:state.verifyError??null}},updateUser:async p=>{state.calls.push(['update',p]);return {error:null}},signOut:async()=>({error:null})};state.fake=fake;
const compiled=await build({stdin:{contents:"export * as route from './app/api/auth/[action]/route.ts';export * as workspaceRoute from './app/api/workspace/[...path]/route.ts';export * as portalRoute from './app/api/portal/[...path]/route.ts';export * as integrationRoute from './app/api/integration/[...path]/route.ts';export * as legalRoute from './app/api/legal/route.ts';export * as legal from './lib/server/legal.ts';export * as http from './lib/server/http.ts';export * as versions from './lib/legal.ts';export * as auth from './lib/auth/server.ts';export {Service} from './lib/server/service.ts';export {sendInvitation} from './lib/server/invitation-mail.ts';export {mutationGuard} from './lib/server/files.ts';",resolveDir:process.cwd(),sourcefile:'test.ts'},bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'runtime',setup(b){b.onResolve({filter:/^(cloudflare:workers|next\/headers|next\/navigation|@supabase\/ssr)$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},a=>({loader:'js',contents:a.path==='cloudflare:workers'?'export const env=globalThis.__emailAuthTest.env':a.path==='next/headers'?'export async function headers(){return globalThis.__emailAuthTest.headers};export async function cookies(){return {getAll:()=>[],set(){}}}':a.path==='next/navigation'?'export function redirect(path){throw new Error("redirect:"+path)}':'export function createServerClient(){return {auth:globalThis.__emailAuthTest.fake}}'}))}}]});
const {route,workspaceRoute,portalRoute,integrationRoute,auth,Service,sendInvitation,mutationGuard,legalRoute,legal,http,versions}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
class D1{constructor(){this.sql=new DatabaseSync(':memory:');this.sql.exec('PRAGMA foreign_keys=ON');for(const file of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())this.sql.exec(readFileSync('drizzle/'+file,'utf8'))}prepare(sql){const db=this;return {sql,args:[],bind(...a){this.args=a;return this},async first(){return db.sql.prepare(sql).get(...this.args)??null},async all(){return {results:db.sql.prepare(sql).all(...this.args),meta:{changes:Number(db.sql.prepare('SELECT changes() n').get().n)}}},async run(){const r=db.sql.prepare(sql).run(...this.args);return {meta:{changes:Number(r.changes)}}}}}async batch(list){this.sql.exec('BEGIN');try{const r=[];for(const s of list)r.push(/RETURNING/i.test(s.sql)?await s.all():await s.run());this.sql.exec('COMMIT');return r}catch(e){this.sql.exec('ROLLBACK');throw e}}}
function setup(){const db=new D1();Object.assign(state.env,{DB:db,SUPABASE_URL:'https://project.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-key',QUEVIAN_SITE_URL:'https://quevian.test',QUEVIAN_EMAIL_AUTH_ENABLED:'true',RESEND_API_KEY:undefined,QUEVIAN_EMAIL_FROM:undefined});state.headers=new Headers();state.user=null;state.calls=[];state.loginError=null;state.verifyError=null;return db}
const acceptance={acceptedTerms:true,acknowledgedPrivacy:true,adultAndAuthorized:true,termsVersion:versions.TERMS_VERSION,privacyVersion:versions.PRIVACY_VERSION};
const verified={id:'verified-subject',email:'person@example.com',email_confirmed_at:'2026-09-08T00:00:00Z',is_anonymous:false,user_metadata:{full_name:'Person'}};
const post=(action,data,headers={})=>route.POST(new Request('https://quevian.test/api/auth/'+action,{method:'POST',headers:{'Content-Type':'application/json','X-QueuePilot-Request':'1',Origin:'https://quevian.test',...headers},body:JSON.stringify(data)}),{params:Promise.resolve({action})});
test('auth actions fail closed when disabled and reject cross-site mutations',async()=>{const db=setup();try{state.env.QUEVIAN_EMAIL_AUTH_ENABLED='false';assert.equal((await post('signup',{...acceptance,email:'person@example.com'})).status,503);state.env.QUEVIAN_EMAIL_AUTH_ENABLED='true';assert.equal((await post('login',{email:'person@example.com',password:'whatever'},{Origin:'https://attacker.test'})).status,403);assert.equal(state.calls.length,0)}finally{db.sql.close()}});
test('signup validates passwords before contacting the provider and preserves safe destinations',async()=>{const db=setup();try{assert.equal((await post('signup',{...acceptance,email:'person@example.com',password:'short',name:'Person'})).status,400);assert.equal(state.calls.length,0);assert.equal((await post('signup',{...acceptance,email:'person@example.com',password:'a-long-unique-password',name:'Person',next:'https://attacker.test'})).status,200);assert.equal(state.calls[0][1].options.emailRedirectTo,'https://quevian.test/auth/confirm?next=%2Fapp')}finally{db.sql.close()}});
test('login rejects unverified and anonymous identities and sanitizes redirects',async()=>{const db=setup();try{state.user={...verified,email_confirmed_at:null};assert.equal((await post('login',{email:verified.email,password:'test'})).status,403);state.user={...verified,is_anonymous:true};assert.equal((await post('login',{email:verified.email,password:'test'})).status,403);state.user=verified;assert.equal((await (await post('login',{email:verified.email,password:'test',next:'//attacker.test'})).json()).next,'/app')}finally{db.sql.close()}});
test('password reset requires verified provider identity; invalid confirmation is rejected',async()=>{const db=setup();try{assert.equal((await post('reset',{password:'my-new-long-password'})).status,401);state.user=verified;assert.equal((await post('reset',{password:'my-new-long-password'})).status,200);state.verifyError={code:'otp_expired'};assert.equal((await post('confirm',{token_hash:'a'.repeat(30),type:'recovery'})).status,400);assert.equal((await post('confirm',{token_hash:'a'.repeat(30),type:'admin'})).status,400)}finally{db.sql.close()}});
test('recovery replies are generic and email-specific throttles are enforced',async()=>{const db=setup();try{for(let i=0;i<5;i++){const r=await post('forgot',{email:'person@example.com'});assert.equal(r.status,200);assert.match((await r.json()).message,/If an account exists/)}assert.equal((await post('forgot',{email:'person@example.com'})).status,429)}finally{db.sql.close()}});
test('ChatGPT headers cannot sign in or link an account; existing verified links still work',async()=>{const db=setup();try{
 const legacy={id:'legacy-owner',email:verified.email,name:'Original owner'};const org=await new Service(db,legacy).createOrganization({name:'Existing company'});
 state.headers=new Headers({'oai-authenticated-user-id':legacy.id,'oai-authenticated-user-email':legacy.email});
 assert.equal(await auth.accountIdentity(),null);await assert.rejects(http.service(),e=>e.status===401);
 state.user=verified;assert.equal((await auth.accountIdentity()).id,'supabase:'+verified.id);
 assert.equal((await post('link',{})).status,404);assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM auth_links').get().n,0);
 db.sql.prepare('INSERT INTO auth_links(subject,user_id,created) VALUES(?,?,?)').run(verified.id,legacy.id,new Date().toISOString());
 assert.equal((await auth.accountIdentity()).id,legacy.id);assert.equal((await new Service(db,await auth.accountIdentity()).context(org.id)).role,'Owner');
 assert.equal((await (await post('logout',{})).json()).next,'/login');
}finally{db.sql.close()}});

test('safe return paths permit invitations but block external URLs and reserved auth routes',()=>{assert.equal(auth.safeNext('/invite/abc-123'),'/invite/abc-123');for(const path of ['https://attacker.test','//attacker.test','/\\attacker.test','/signin-with-chatgpt','/api/account','/logout'])assert.equal(auth.safeNext(path),'/app')});
test('reissued invitations invalidate old links and delivery fails honestly without a sender',async()=>{const db=setup();try{const owner=new Service(db,{id:'owner',email:'owner@example.com',name:'Owner'}),org=(await owner.createOrganization({name:'Team'})).id;const old=await owner.invite(org,{email:verified.email,role:'Engineer'});const current=await owner.invite(org,{email:verified.email,role:'Viewer'});assert.notEqual(old.id,current.id);const member=new Service(db,{id:'member',email:verified.email,name:'Member'});await assert.rejects(member.acceptInvitation({invitationId:old.id}),e=>e.status===404);assert.equal((await sendInvitation(owner,org,current.id)).status,'not_configured');await member.acceptInvitation({invitationId:current.id});assert.equal((await member.context(org)).role,'Viewer');await assert.rejects(sendInvitation(owner,org,current.id),e=>e.status===404)}finally{db.sql.close()}});
test('mail retries are throttled and provider acceptance is not sent twice',async()=>{const db=setup(),originalFetch=globalThis.fetch;let sends=0;try{state.env.RESEND_API_KEY='test-only';state.env.QUEVIAN_EMAIL_FROM='Quevian <no-reply@example.com>';const owner=new Service(db,{id:'owner',email:'owner@example.com',name:'Owner'}),org=(await owner.createOrganization({name:'Team'})).id;const invitation=await owner.invite(org,{email:verified.email,role:'Engineer'});globalThis.fetch=async(_url,opts)=>{sends++;assert.equal(opts.headers['Idempotency-Key'],'quevian-invite/'+invitation.id);return Response.json({error:'temporary'},{status:503})};assert.equal((await sendInvitation(owner,org,invitation.id)).status,'failed');await assert.rejects(sendInvitation(owner,org,invitation.id),e=>e.status===429);db.sql.prepare("UPDATE invitation_deliveries SET updated='2020-01-01'").run();globalThis.fetch=async()=>{sends++;return Response.json({id:'email-id'})};assert.equal((await sendInvitation(owner,org,invitation.id)).status,'sent');assert.equal((await sendInvitation(owner,org,invitation.id)).status,'sent');assert.equal(sends,2);const outsider=new Service(db,{id:'outsider',email:'outsider@example.com',name:'Outsider'});await assert.rejects(sendInvitation(outsider,org,invitation.id),e=>e.status===403)}finally{globalThis.fetch=originalFetch;db.sql.close()}});

test('current and legacy request headers pass while cross-site and unmarked requests fail',()=>{
 const req=h=>new Request('https://quevian.test/api/workspace/demo/invitations',{method:'POST',headers:h});
 for(const key of ['X-Quevian-Request','X-QueuePilot-Request']){
  assert.doesNotThrow(()=>mutationGuard(req({[key]:'1',Origin:'https://quevian.test','Sec-Fetch-Site':'same-origin'})));
  assert.throws(()=>mutationGuard(req({[key]:'1',Origin:'https://attacker.test'})),e=>e.status===403);
  assert.throws(()=>mutationGuard(req({[key]:'1','Sec-Fetch-Site':'cross-site'})),e=>e.status===403);
 }
 assert.throws(()=>mutationGuard(req({Origin:'https://quevian.test'})),e=>e.status===403);
 assert.throws(()=>mutationGuard(req({'X-Quevian-Request':'0'})),e=>e.status===403);
});

test('new verified signup proceeds through login, organization setup, a board, a ticket and accepted staff invitation',async()=>{
 const db=setup();try{
 const signup=await post('signup',{...acceptance,email:verified.email,password:'a-unique-long-password',name:'New owner'});assert.equal(signup.status,200);
 assert.equal(await auth.verifiedUser(),null);
 assert.equal((await post('confirm',{token_hash:'valid-confirmation-token-hash',type:'signup',next:'/app'})).status,200);
 state.user=verified;assert.equal((await post('login',{email:verified.email,password:'a-unique-long-password'})).status,200);
 const owner=new Service(db,await auth.accountIdentity()),org=(await owner.createOrganization({name:'Signup journey'})).id;
 const company=(await owner.directory(org,'companies',{name:'First customer'})).id;
 const board=(await owner.directory(org,'boards',{name:'New board',statuses:[{name:'Queued',closed:false},{name:'Done',closed:true}]})).id;
 const ticket=await owner.createTicket(org,{title:'First real workflow',companyId:company,boardId:board});assert.equal(ticket.status,'Queued');
 const i=await owner.invite(org,{email:'staff@example.com',role:'Engineer'});
 const staff=new Service(db,{id:'supabase:staff',email:'staff@example.com',name:'Staff'});await staff.account();await assert.rejects(staff.ticket(org,ticket.id),e=>e.status===403);
 await staff.acceptInvitation({invitationId:i.id});assert.equal((await staff.ticket(org,ticket.id)).title,'First real workflow');
 }finally{db.sql.close()}
});

const acceptRequest=(payload=acceptance,origin='https://quevian.test')=>legalRoute.POST(new Request('https://quevian.test/api/legal',{method:'POST',headers:{'Content-Type':'application/json','X-Quevian-Request':'1',Origin:origin},body:JSON.stringify(payload)}));
test('signup refuses missing, declined, or stale policies before calling the auth provider',async()=>{
 const db=setup();try{
  const fields={email:verified.email,password:'a-unique-long-password',name:'Person'};
  for(const policy of [{},{...acceptance,acceptedTerms:false},{...acceptance,adultAndAuthorized:false},{...acceptance,acknowledgedPrivacy:false},{...acceptance,termsVersion:'old'}]){
   assert.equal((await post('signup',{...fields,...policy})).status,400);
  }
  assert.equal(state.calls.length,0);
 }finally{db.sql.close()}
});
test('policy acceptance requires a verified identity and same-origin explicit current choices',async()=>{
 const db=setup();try{
  assert.equal((await acceptRequest()).status,401);
  state.user={...verified,email_confirmed_at:null};assert.equal((await acceptRequest()).status,401);
  state.user=verified;
  assert.equal((await acceptRequest(acceptance,'https://attacker.test')).status,403);
  for(const value of [{},{...acceptance,acceptedTerms:false},{...acceptance,acknowledgedPrivacy:false},{...acceptance,adultAndAuthorized:false},{...acceptance,termsVersion:'old'},{...acceptance,privacyVersion:'old'},{...acceptance,userId:'victim'},{...acceptance,accepted_at:'2000-01-01'}]){
   assert.equal((await acceptRequest(value)).status,400);
  }
  assert.equal(db.sql.prepare('SELECT COUNT(*) n FROM legal_acceptances').get().n,0);
 }finally{db.sql.close()}
});
test('acceptance is server-attributed, timestamped, idempotent, and unlocks only that identity',async()=>{
 const db=setup();try{
  state.user={...verified,user_metadata:{...verified.user_metadata,acceptedTerms:true,termsVersion:versions.TERMS_VERSION}};
  await assert.rejects(http.service(),e=>e.status===428);
  const before=Date.now();assert.equal((await acceptRequest()).status,200);
  const row=db.sql.prepare('SELECT * FROM legal_acceptances').get();
  assert.equal(row.user_id,'supabase:'+verified.id);assert.equal(row.terms_version,versions.TERMS_VERSION);
  assert.equal(row.privacy_version,versions.PRIVACY_VERSION);assert.ok(Date.parse(row.accepted_at)>=before&&Date.parse(row.accepted_at)<=Date.now());
  assert.equal((await http.service()).user.id,row.user_id);
  assert.equal((await acceptRequest()).status,200);assert.deepEqual(db.sql.prepare('SELECT * FROM legal_acceptances').get(),row);
  state.user={...verified,id:'another-subject'};await assert.rejects(http.service(),e=>e.status===428);
  assert.equal(await legal.hasAcceptedTerms(db,'another-subject'),false);
 }finally{db.sql.close()}
});
test('only verified email identities can review terms before entering pages and retain safe return paths',async()=>{
 const db=setup();try{
  await assert.rejects(auth.requireAccount('/portal'),/redirect:\/login\?next=%2Fportal/);
  state.headers=new Headers({'oai-authenticated-user-id':'legacy','oai-authenticated-user-email':'legacy@example.com'});
  await assert.rejects(auth.requireAccount('/invite/test-id'),/redirect:\/login\?next=%2Finvite%2Ftest-id/);
  assert.equal((await acceptRequest()).status,401);state.user=verified;
  await assert.rejects(auth.requireAccount('/invite/test-id'),/redirect:\/review-terms\?next=%2Finvite%2Ftest-id/);
  assert.equal((await acceptRequest()).status,200);
  assert.equal((await auth.requireAccount('/portal')).id,'supabase:'+verified.id);
  db.sql.prepare("UPDATE legal_acceptances SET terms_version='old'").run();
  await assert.rejects(auth.requireAccount('https://attacker.test'),/redirect:\/review-terms\?next=%2Fapp/);
 }finally{db.sql.close()}
});

const routeRequest=(route,method,path,payload)=>route[method](new Request('https://quevian.test/api/check'+(method==='GET'?'?checkout=success':''),{method,...(method==='GET'?{}:{headers:{'Content-Type':'application/json','X-Quevian-Request':'1',Origin:'https://quevian.test'},body:JSON.stringify(payload??{})})}),{params:Promise.resolve({path})});
test('unpaid users cannot read or change tickets, files, documents, search or dashboards through direct routes',async()=>{
 const db=setup();try{
  state.user=verified;await acceptRequest();const s=await http.service(),org=(await s.createOrganization({name:'Paid-only workspace'})).id;
  const company=(await s.directory(org,'companies',{name:'Client'})).id,board=(await s.workspace(org)).boards[0].id;
  const ticket=await s.createTicket(org,{title:'Private paid ticket',companyId:company,boardId:board});
  state.env.QUEVIAN_BILLING_REQUIRED='false'; // An old runtime flag cannot bypass purchase.
  for(const tail of [[],['tickets'],['tickets',String(ticket.id)],['tickets',String(ticket.id),'files','fake'],['documents','fake'],['dashboard'],['search'],['companies'],['reports']]){
   const response=await routeRequest(workspaceRoute,'GET',[org,...tail]);assert.equal(response.status,402,tail.join('/'));assert.doesNotMatch(await response.text(),/Private paid ticket/);
  }
  assert.equal((await routeRequest(workspaceRoute,'POST',[org,'tickets'],{title:'Blocked',companyId:company,boardId:board})).status,402);
  assert.equal((await routeRequest(workspaceRoute,'PATCH',[org,'tickets',String(ticket.id)],{title:'Blocked edit',version:1})).status,402);
  assert.equal((await s.ticket(org,ticket.id)).title,'Private paid ticket');
  const billing=await routeRequest(workspaceRoute,'GET',[org,'subscription']);assert.equal(billing.status,200);assert.equal((await billing.json()).accessAllowed,false);
  assert.equal((await routeRequest(workspaceRoute,'GET',['another-workspace','subscription'])).status,403);
  assert.equal((await routeRequest(workspaceRoute,'GET',['another-workspace','tickets'])).status,403);
 }finally{db.sql.close()}
});
test('only an active, unexpired purchased subscription unlocks ticket reads and writes',async()=>{
 const db=setup();try{
  state.user=verified;await acceptRequest();const s=await http.service(),org=(await s.createOrganization({name:'Licensed workspace'})).id;
  const company=(await s.directory(org,'companies',{name:'Client'})).id,board=(await s.workspace(org)).boards[0].id;
  db.sql.prepare("INSERT INTO workspace_subscriptions(org_id,subscription_id,status,seats,period_end,updated) VALUES(?,?,'active',1,?,?)").run(org,'sub_paid',Math.floor(Date.now()/1000)+3600,new Date().toISOString());
  assert.equal((await routeRequest(workspaceRoute,'GET',[org])).status,200);
  assert.equal((await routeRequest(workspaceRoute,'POST',[org,'tickets'],{title:'Paid ticket',companyId:company,boardId:board})).status,200);
  for(const status of ['pending','trialing','incomplete','incomplete_expired','past_due','unpaid','paused','canceled']){
   db.sql.prepare('UPDATE workspace_subscriptions SET status=? WHERE org_id=?').run(status,org);
   assert.equal((await routeRequest(workspaceRoute,'GET',[org,'tickets'])).status,402,status);
   assert.equal((await (await routeRequest(workspaceRoute,'GET',[org,'subscription'])).json()).accessAllowed,false,status);
  }
  db.sql.prepare("UPDATE workspace_subscriptions SET status='active',period_end=1 WHERE org_id=?").run(org);
  assert.equal((await routeRequest(workspaceRoute,'GET',[org,'tickets'])).status,402);
  db.sql.prepare("UPDATE workspace_subscriptions SET period_end=?,subscription_id=NULL WHERE org_id=?").run(Math.floor(Date.now()/1000)+3600,org);
  assert.equal((await routeRequest(workspaceRoute,'GET',[org,'tickets'])).status,402);
  db.sql.prepare("UPDATE workspace_subscriptions SET subscription_id='sub_paid',seats=0 WHERE org_id=?").run(org);
  assert.equal((await routeRequest(workspaceRoute,'GET',[org,'tickets'])).status,402);
 }finally{db.sql.close()}
});
test('portal tickets and integration feeds require their own workspace subscription',async()=>{
 const db=setup();try{
  state.user=verified;await acceptRequest();const s=await http.service(),org=(await s.createOrganization({name:'Provider'})).id;
  const company=(await s.directory(org,'companies',{name:'Client'})).id;await s.grantSave(org,{companyId:company,email:verified.email});
  for(const tail of [[],['1001'],['1001','files','fake'],['documents','fake']])assert.equal((await routeRequest(portalRoute,'GET',[org,company,...tail])).status,402);
  assert.equal((await routeRequest(portalRoute,'POST',[org,company],{title:'Blocked',description:'Help'})).status,402);
  for(const resource of ['tickets','events']){
   const key=await s.keyCreate(org,{name:'Paid access test',scope:resource+':read',days:1});
   const response=await integrationRoute.GET(new Request('https://quevian.test/api/integration/'+org+'/'+resource,{headers:{Authorization:'Bearer '+key.token}}),{params:Promise.resolve({path:[org,resource]})});assert.equal(response.status,402,resource);
  }
  db.sql.prepare("INSERT INTO workspace_subscriptions(org_id,subscription_id,status,seats,period_end,updated) VALUES(?,?,'active',1,?,?)").run(org,'sub_paid',Math.floor(Date.now()/1000)+3600,new Date().toISOString());
  assert.equal((await routeRequest(portalRoute,'GET',[org,company])).status,200);
 }finally{db.sql.close()}
});
