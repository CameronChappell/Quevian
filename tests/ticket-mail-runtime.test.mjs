import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';

test('support mail can retrieve messages in Workers and rejects provider redirects', async()=>{
 const bundle=await build({
  stdin:{contents:`
   import {TicketMail} from './lib/server/ticket-mail';
   export default {async fetch(){
    const db={prepare(){return {bind(){return this},async first(){return null}}}};
    const mail=new TicketMail(db,{id:'runtime-test',email:'staff@example.com',name:'Staff'});
    try{return Response.json(await mail.receiveMail('11111111-1111-4111-8111-111111111111'))}
    catch(error){return Response.json({error:error.message},{status:error.status??500})}
   }};
  `,resolveDir:process.cwd(),sourcefile:'ticket-mail-runtime-worker.ts',loader:'ts'},
  bundle:true,format:'esm',platform:'browser',external:['cloudflare:workers'],write:false
 });
 const requests=[];
 let redirect=false;
 const mf=new Miniflare({
  modules:true,compatibilityDate:'2026-05-01',script:bundle.outputFiles[0].text,
  bindings:{RESEND_API_KEY:'runtime-test-only'},
  outboundService:async request=>{
   requests.push({url:request.url,authorization:request.headers.get('authorization')});
   if(redirect)return new Response(null,{status:302,headers:{Location:'https://untrusted.example/redirect'}});
   return Response.json({from:'person@example.com',to:['unmatched@inbound.example.com'],subject:'Test',text:'Test',headers:{},attachments:[],message_id:'<test@example.com>'});
  }
 });
 try{
  const accepted=await mf.dispatchFetch('https://worker.test/');
  assert.equal(accepted.status,200,await accepted.clone().text());
  assert.deepEqual(await accepted.json(),{ignored:'unknown-or-ambiguous-recipient'});
  assert.equal(requests.length,1);
  assert.equal(requests[0].url,'https://api.resend.com/emails/receiving/11111111-1111-4111-8111-111111111111');
  assert.equal(requests[0].authorization,'Bearer runtime-test-only');
  redirect=true;
  const rejected=await mf.dispatchFetch('https://worker.test/');
  assert.equal(rejected.status,502,await rejected.clone().text());
  assert.equal(requests.length,2,'The redirect destination must never receive a request');
  assert.ok(requests.every(request=>new URL(request.url).hostname==='api.resend.com'));
 }finally{await mf.dispose()}
});
