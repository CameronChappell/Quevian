import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {createServer} from 'vite';
import {build} from 'esbuild';
import {D1} from './support/database.mjs';
import {credentialFindings} from '../build/client-security.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const vite=await createServer({appType:'custom',configFile:false,root,resolve:{alias:{'@':root}},server:{middlewareMode:true}});
after(()=>vite.close());
const compiled=await build({entryPoints:['lib/server/completion.ts'],bundle:true,format:'esm',platform:'node',write:false});
const {Completion}=await import('data:text/javascript;base64,'+Buffer.from(compiled.outputFiles[0].text).toString('base64'));
const owner={id:'privacy-owner',name:'Owner',email:'owner@example.test'};

test('new-key markup contains only a fixed mask and no input or secret attributes',async()=>{
 const {HiddenApiKey}=await vite.ssrLoadModule('/components/queuepilot/api-key-secret.tsx');
 const html=renderToStaticMarkup(React.createElement(HiddenApiKey));
 assert.match(html,/API key hidden/);
 assert.match(html,/••••/);
 assert.doesNotMatch(html,/<input|<textarea|value=|data-token|data-secret/);
 assert.deepEqual(credentialFindings(html),[]);
});
test('API-key controls are absent from ordinary-user workspace tools',async()=>{
 const {WorkspaceTools}=await vite.ssrLoadModule('/components/queuepilot/advanced.tsx');
 const hidden=renderToStaticMarkup(React.createElement(WorkspaceTools,{navigate(){}}));
 const visible=renderToStaticMarkup(React.createElement(WorkspaceTools,{navigate(){},canManageApiKeys:true}));
 assert.doesNotMatch(hidden,/API &amp; security|Create scoped, expiring keys/);
 assert.match(visible,/API &amp; security/);
});
test('ordinary roles cannot mount the API-management panel',async()=>{
 const {ApiSecurity}=await vite.ssrLoadModule('/components/queuepilot/completion.tsx');
 for(const role of ['Viewer','Engineer','Manager']){
  const html=renderToStaticMarkup(React.createElement(ApiSecurity,{org:'test',workspace:{organization:{role}}}));
  assert.doesNotMatch(html,/Create key|Available endpoints|Copy key/);
 }
});
test('key display uses an explicit copy action, has bounded lifetime, and no persistent storage',()=>{
 const source=readFileSync('components/queuepilot/api-key-secret.tsx','utf8');
 assert.match(source,/navigator\.clipboard\.writeText\(token\)/);
 assert.match(source,/onClick=\{copy\}/);
 assert.match(source,/60_000/);
 assert.match(source,/visibilitychange/);
 assert.match(source,/pagehide/);
 assert.doesNotMatch(source,/localStorage|sessionStorage|console\.|value=\{token\}|\{token\}<|data-(?:token|secret)/);
 const integration=readFileSync('components/queuepilot/completion.tsx','utf8');
 assert.doesNotMatch(integration,/value=\{token\}/);
 assert.match(integration,/<ApiSecurityPanel key=\{props\.org\}/);
});
test('only key metadata is returned by lists and audit, never raw key or hash',async()=>{
 const db=new D1();
 try{
  const s=new Completion(db,owner),org=(await s.createOrganization({name:'Privacy tests'})).id;
  const created=await s.keyCreate(org,{name:'Reporting',scope:'tickets:read',days:1});
  const stored=db.sql.prepare('SELECT hash FROM api_keys WHERE id=?').get(created.id);
  assert.notEqual(stored.hash,created.token);
  const listing=await s.keys(org);
  assert.deepEqual(Object.keys(listing.keys[0]).sort(),['id','name','userId','scope','expires','revoked','created'].sort());
  const audit=JSON.stringify(await s.audit(org,new URL('https://example.test')));
  for(const value of [JSON.stringify(listing),audit]){
   // Use boolean assertions so a failed test cannot print a generated key.
   assert.equal(value.includes(created.token),false,'Raw key was disclosed');
   assert.equal(value.includes(stored.hash),false,'Key hash was disclosed');
  }
 }finally{db.close();}
});
test('API-key creation, listing and revocation reject ordinary roles and other tenants',async()=>{
 const db=new D1();
 try{
  const s=new Completion(db,owner),org=(await s.createOrganization({name:'Private keys'})).id;
  const key=await s.keyCreate(org,{name:'Reporting',scope:'tickets:read',days:1});
  for(const role of ['Viewer','Engineer','Manager']){
   const person={id:'privacy-'+role,name:role,email:role.toLowerCase()+'@example.test'},member=new Completion(db,person);
   await member.account();await s.invite(org,{email:person.email,role});
   const invitation=(await member.account()).invitations[0];await member.acceptInvitation({invitationId:invitation.id});
   for(const call of [()=>member.keys(org),()=>member.keyCreate(org,{name:'No',scope:'tickets:read',days:1}),()=>member.keyRevoke(org,key.id)])await assert.rejects(call,e=>e.status===403);
  }
  const other=new Completion(db,{id:'other-owner',name:'Other owner',email:'other@example.test'});
  await other.createOrganization({name:'Other tenant'});
  await assert.rejects(other.keys(org),e=>e.status===403);
  await assert.rejects(other.keyCreate(org,{name:'No',scope:'tickets:read',days:1}),e=>e.status===403);
  await assert.rejects(other.keyRevoke(org,key.id),e=>e.status===403);
  await s.verifyKey(org,key.token,'tickets:read');
 }finally{db.close();}
});
