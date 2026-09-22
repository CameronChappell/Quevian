import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../lib/security-policy.ts', import.meta.url), 'utf8');
// Local review can use Node's type stripper; repository CI uses the existing esbuild dependency.
let policy, runtime;
if (process.env.QUEVIAN_LOCAL_POLICY_TEST === '1') {
  policy = await import('../lib/security-policy.ts');
  runtime = await import('../lib/runtime-security.ts');
} else {
  const {build} = await import('esbuild');
  const compile = async file => {
    const result = await build({entryPoints: [file], bundle: true, format: 'esm', platform: 'node', write: false});
    return import('data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].text).toString('base64'));
  };
  policy = await compile('lib/security-policy.ts');
  runtime = await compile('lib/runtime-security.ts');
}
const {guardMutation, readBoundedBody, parseObjectJson, validateFileData, readUpload, applySecurityHeaders, isSensitiveDeploymentPath} = policy;
const enc = text => new TextEncoder().encode(text);
const status = code => error => error.status === code;
const request = (headers = {}, method = 'POST', body = '{}') => new Request('https://quevian.test/api/account', {method, headers: {'X-Quevian-Request': '1', Origin: 'https://quevian.test', ...headers}, ...(method === 'GET' ? {} : {body})});

test('same-origin CSRF proof passes', () => assert.doesNotThrow(() => guardMutation(request())));
test('custom request header is required', () => assert.throws(() => guardMutation(request({'X-Quevian-Request': '0'})), status(403)));
test('cross-origin and null origins fail', () => {for (const Origin of ['https://attacker.test','null','https://quevian.test.attacker.test']) assert.throws(() => guardMutation(request({Origin})), status(403));});
test('sibling-subdomain and cross-site fetch metadata fail', () => {for (const value of ['same-site','cross-site']) assert.throws(() => guardMutation(request({'Sec-Fetch-Site': value})), status(403));});
test('GET never authorizes a mutation', () => assert.throws(() => guardMutation(request({}, 'GET')), status(405)));
test('bounded JSON accepts exact permitted size', async () => assert.equal((await readBoundedBody(request({}, 'POST','{}'),2)).length,2));
test('stream length is checked without Content-Length', async () => assert.rejects(readBoundedBody(request({},'POST','oversize'),2),status(413)));
test('forged small Content-Length cannot bypass byte limit', async () => assert.rejects(readBoundedBody(request({'Content-Length':'1'},'POST','oversize'),2),status(413)));
test('declared oversized requests fail before reading', async () => assert.rejects(readBoundedBody(request({'Content-Length':'99999'}),2),status(413)));
test('JSON requires an object and valid UTF-8', () => {for(const text of ['null','[]','2','"value"','{bad']) assert.throws(()=>parseObjectJson(enc(text)),status(400));assert.throws(()=>parseObjectJson(new Uint8Array([255])),status(400));});
test('prototype pollution keys fail recursively', () => {for(const key of ['__proto__','constructor','prototype']) assert.throws(()=>parseObjectJson(enc('{"items":[{"'+key+'":{}}]}')),status(400));assert.equal({}.polluted,undefined);});
test('deep structures are rejected', () => {let value={};for(let i=0;i<25;i++)value={value};assert.throws(()=>parseObjectJson(enc(JSON.stringify(value))),status(400));});
test('ticket text is kept as data rather than HTML-sanitized destructively', () => {const body='<script>alert(1)</script>';assert.equal(parseObjectJson(enc(JSON.stringify({body}))).body,body);});
test('valid PDF signature and UTF-8 text are allowed',()=>{assert.equal(validateFileData('report.pdf','application/pdf',enc('%PDF-1.7\n%%EOF')),'report.pdf');assert.equal(validateFileData('notes.txt','text/plain',enc('Hello')),'notes.txt');});
test('active and double-extension filenames are rejected',()=>{for(const name of ['payload.html','image.svg','script.js','bill.exe.pdf','macro.docm','folder/file.txt','..\\file.txt','evil\u202etxt.pdf'])assert.throws(()=>validateFileData(name,'',enc('data')),e=>[400,415].includes(e.status));});
test('file content and MIME spoofing are rejected',()=>{assert.throws(()=>validateFileData('photo.png','image/png',enc('not a png')),status(415));assert.throws(()=>validateFileData('notes.txt','text/html',enc('<html>')),status(415));assert.throws(()=>validateFileData('notes.txt','text/plain',new Uint8Array([77,90,0,0])),status(415));});
test('empty and oversized files are rejected',()=>{assert.throws(()=>validateFileData('file.txt','',new Uint8Array()),status(413));assert.throws(()=>validateFileData('file.txt','',new Uint8Array(5*1024*1024+1)),status(413));});
test('corrupt Office archives are rejected without extraction',()=>assert.throws(()=>validateFileData('report.docx','',enc('PK\x03\x04not an Office archive')),status(415)));
test('upload parsing enforces single-file and visibility fields',async()=>{const form=new FormData();form.append('file',new File(['hello'],'notes.txt',{type:'text/plain'}));form.append('visibility','Customer');const r=new Request('https://quevian.test/upload',{method:'POST',headers:{'X-Quevian-Request':'1',Origin:'https://quevian.test'},body:form});assert.deepEqual(await readUpload(r),{name:'notes.txt',bytes:enc('hello'),visibility:'Customer'});const duplicate=new FormData();duplicate.append('file',new File(['a'],'a.txt'));duplicate.append('file',new File(['b'],'b.txt'));await assert.rejects(readUpload(new Request('https://quevian.test/upload',{method:'POST',headers:{'X-Quevian-Request':'1',Origin:'https://quevian.test'},body:duplicate})),status(400));});
test('security headers preserve cookies and remove API CORS grants',()=>{const h=new Headers({'Access-Control-Allow-Origin':'*','Access-Control-Allow-Credentials':'true','X-Powered-By':'debug','Set-Cookie':'session=test; HttpOnly; Secure; SameSite=Lax'});applySecurityHeaders(h,new URL('https://quevian.test/api/operator'));assert.equal(h.get('access-control-allow-origin'),null);assert.equal(h.get('x-powered-by'),null);assert.equal(h.get('cache-control'),'private, no-store');assert.match(h.get('set-cookie'),/HttpOnly/);assert.match(h.get('strict-transport-security'),/31536000/);assert.match(h.get('content-security-policy'),/frame-ancestors/);assert.match(h.get('content-security-policy-report-only'),/script-src 'self'/);});
test('nested workspace and authentication pages are private',()=>{for(const path of ['/app/settings','/portal/acme','/auth/confirm','/login']){const h=new Headers();applySecurityHeaders(h,new URL('https://quevian.test'+path));assert.equal(h.get('cache-control'),'private, no-store');}});
test('HTTP responses do not advertise HSTS before HTTPS',()=>{const h=new Headers();applySecurityHeaders(h,new URL('http://localhost/'));assert.equal(h.get('strict-transport-security'),null);});
test('environment files, Git data, debug endpoints, maps and database downloads are denied',()=>{for(const path of ['/.env','/.env.production','/.git/config','/%2eenv','/@vite/client','/assets/source.js.map','/backup.sqlite'])assert.equal(isSensitiveDeploymentPath(path),true);assert.equal(isSensitiveDeploymentPath('/app/settings'),false);});
test('privileged Supabase keys are not accepted as public keys',()=>{const jwt=role=>'e30.'+Buffer.from(JSON.stringify({role})).toString('base64url')+'.signature';assert.equal(runtime.isPrivilegedSupabaseKey(jwt('service_role')),true);assert.equal(runtime.isPrivilegedSupabaseKey(jwt('anon')),false);assert.equal(runtime.isPrivilegedSupabaseKey('sb_secret_example'),true);});
test('production configuration checks never disclose values',()=>{const secret='PRIVATE_VALUE_DO_NOT_PRINT';const errors=runtime.runtimeSecurityProblems({NEXT_PUBLIC_RESEND_API_KEY:secret,QUEVIAN_EMAIL_AUTH_ENABLED:'true',SUPABASE_URL:'http://insecure.test',QUEVIAN_SITE_URL:'https://quevian.test/path',SUPABASE_PUBLISHABLE_KEY:'sb_secret_example'});assert.ok(errors.length>=4);assert.ok(!JSON.stringify(errors).includes(secret));});
test('HTTPS origins reject credentials, paths, query strings and fragments',()=>{assert.equal(runtime.isHttpsOrigin('https://quevian.com'),true);for(const value of ['http://quevian.com','https://user:pass@quevian.com','https://quevian.com/path','https://quevian.com/?x=1'])assert.equal(runtime.isHttpsOrigin(value),false);});
test('policy source does not enable wildcard credentialed CORS or render upload HTML',()=>{assert.ok(!source.includes("headers.set('Access-Control-Allow-Origin', '*')"));assert.ok(!source.includes('innerHTML'));});
