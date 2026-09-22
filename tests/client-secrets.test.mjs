import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,mkdirSync,rmSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {credentialFindings,assertPublicAsset,assertPublicEnvironment,assertClientModules,scanPublicDirectory,clientSecurity} from '../build/client-security.mjs';

// Construct fake credentials, rather than commit usable or secret-shaped literals.
const examples=[
 ['stripe-secret','sk_'+'live_'+'A'.repeat(32)],
 ['stripe-secret','rk_'+'test_'+'B'.repeat(32)],
 ['webhook-secret','whsec_'+'C'.repeat(32)],
 ['supabase-secret','sb_'+'secret_'+'D'.repeat(32)],
 ['resend-secret','re_'+'E'.repeat(32)],
 ['provider-secret','sk-'+'proj-'+'F'.repeat(40)],
 ['workspace-api-key','qp_'+'a'.repeat(64)],
 ['private-key','-----BEGIN '+'PRIVATE KEY-----'],
];
for(const [rule,secret] of examples){
 test('browser assets reject '+rule+' without echoing the credential',()=>{
  assert.ok(credentialFindings('const value='+JSON.stringify(secret)).includes(rule));
  assert.throws(()=>assertPublicAsset('app.js',JSON.stringify(secret)),e=>e.message.includes(rule)&&!e.message.includes(secret));
 });
}
test('legacy privileged JWTs are rejected but public publishable keys are allowed',()=>{
 const part=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
 const jwt=part({alg:'HS256'})+'.'+part({role:'service_role'})+'.signature';
 assert.ok(credentialFindings(jwt).includes('privileged-supabase-jwt'));
 assert.deepEqual(credentialFindings('sb_publishable_example'),[]);
 assert.doesNotThrow(()=>assertPublicEnvironment({VITE_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example'}));
});
test('server binding values are caught even without a known provider prefix',()=>{
 const secret='only-in-server-fixture-value';
 assert.throws(()=>assertPublicAsset('app.html',secret,{CUSTOM_API_KEY:secret}),e=>e.message.includes('server-environment-value')&&!e.message.includes(secret));
});
test('public environment prefixes cannot carry private credentials or disguised values',()=>{
 for(const name of ['VITE_RESEND_API_KEY','NEXT_PUBLIC_STRIPE_SECRET_KEY','QUEVIAN_PUBLIC_ACCESS_TOKEN']){
  assert.throws(()=>assertPublicEnvironment({[name]:'only-in-server-fixture-value'}));
 }
 assert.throws(()=>assertPublicEnvironment({VITE_SUPABASE_PUBLISHABLE_KEY:examples[3][1]}));
 assert.doesNotThrow(()=>assertPublicEnvironment({VITE_SITE_URL:'https://example.test',SUPABASE_SECRET_KEY:examples[3][1]}));
});
test('server credential modules cannot enter client chunks but shared domain types can',()=>{
 const root=resolve('/application');
 for(const path of ['lib/server/http.ts','lib/auth/config.ts','lib/auth/server.ts','worker/index.ts'])assert.throws(()=>assertClientModules([resolve(root,path)],root));
 assert.throws(()=>assertClientModules(['__vite-browser-external:cloudflare:workers'],root));
 assert.doesNotThrow(()=>assertClientModules([resolve(root,'lib/domain.ts')],root));
});
test('public environment files, source maps and private database files are rejected',()=>{
 for(const name of ['.env','.env.production','folder/.dev.vars','.git/config','app.js.map','backup.sqlite','server.key'])assert.throws(()=>assertPublicAsset(name,''));
 assert.doesNotThrow(()=>assertPublicAsset('config.json','{"status":"configured"}'));
});
test('public-directory inspection includes nested assets and rejects symlinks',()=>{
 const dir=mkdtempSync(join(tmpdir(),'qv-public-'));
 try{
  mkdirSync(join(dir,'assets'));writeFileSync(join(dir,'assets','site.js'),'console.log("public")');
  assert.doesNotThrow(()=>scanPublicDirectory(dir));
  writeFileSync(join(dir,'assets','site.js'),examples[0][1]);
  assert.throws(()=>scanPublicDirectory(dir));
  writeFileSync(join(dir,'assets','site.js'),'');
  symlinkSync(join(dir,'assets','site.js'),join(dir,'linked.js'));
  assert.throws(()=>scanPublicDirectory(dir),/symlinks/);
 }finally{rmSync(dir,{recursive:true,force:true});}
});
test('the actual bundler hook fails client leakage without blocking server bindings',()=>{
 const plugin=clientSecurity('/application');
 const bundle={app:{type:'chunk',fileName:'app.js',code:examples[0][1],moduleIds:[]}};
 assert.throws(()=>plugin.generateBundle.call({environment:{config:{consumer:'client'}}},{},bundle));
 assert.doesNotThrow(()=>plugin.generateBundle.call({environment:{config:{consumer:'server'}}},{},bundle));
});
