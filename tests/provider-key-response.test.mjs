import test from 'node:test';
import assert from 'node:assert/strict';
import {request} from './support/render-worker.mjs';

test('public pages and anonymous APIs do not serialize provider bindings',async()=>{
 const runtime=globalThis.__qvRenderedEnv;
 const fixtures={RESEND_API_KEY:'server-only-mail-fixture',RESEND_RECEIVING_API_KEY:'server-only-receiving-fixture',STRIPE_SECRET_KEY:'server-only-billing-fixture',STRIPE_WEBHOOK_SECRET:'server-only-billing-hook-fixture',QUEUEPILOT_OPENAI_KEY:'server-only-ai-fixture',SUPABASE_PUBLISHABLE_KEY:'sb_publishable_fixture'};
 const before={...runtime};Object.assign(runtime,fixtures);
 try{
  for(const path of ['/','/login','/signup','/pricing','/api/account']){
   const response=await request(path),text=await response.text();
   assert.equal(response.status,path==='/api/account'?401:200);
   for(const value of Object.values(fixtures))assert.equal(text.includes(value),false,'A provider binding appeared in a public response');
  }
 }finally{for(const name of Object.keys(fixtures)){if(Object.hasOwn(before,name))runtime[name]=before[name];else delete runtime[name];}}
});
