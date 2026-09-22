import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
const expected={
 'components/queuepilot/completion.tsx':'3605a72d30cd7c4384a19f7527203a2dcc8aa96800f729ebb9f5d0a1eb0f61e0',
 'components/queuepilot/advanced.tsx':'cf0e819e59d4bcb3b10da064af54e0abc085ae220e8144e6fbd0e021ed9bb3a6',
 'components/queuepilot/workspace.tsx':'dfad2cbe47fccef32cee40675be34abfe2b1a4751750da21d72c8823392f459d',
 'vite.config.ts':'84fabaf3c15681ebd1479f1b9c0822c9c6e5c840fd5a060a813345288a33a7a7',
 'vite.pages.config.ts':'360e214868c471324d1913c2c0644b4287d411eded5aa45299dab8fc2a6acd32',
};
for(const [path,hash] of Object.entries(expected))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),hash,'Source changed: '+path);
function replace(path,oldValue,newValue){const source=readFileSync(path,'utf8');assert.equal(source.split(oldValue).length,2,'Unexpected source shape: '+path);writeFileSync(path,source.replace(oldValue,newValue));}
replace('components/queuepilot/completion.tsx',"import {EmailSettings} from './email-settings';","import {EmailSettings} from './email-settings';\nimport {OneTimeApiKey} from './api-key-secret';");
replace('components/queuepilot/completion.tsx','export function ApiSecurity({org,workspace}:Props){const ',"export function ApiSecurity(props:Props){if(!can(props.workspace.organization,'organization:write'))return <p>An organization administrator manages API access.</p>;return <ApiSecurityPanel key={props.org} {...props}/>;}\nfunction ApiSecurityPanel({org,workspace}:Props){const ");
replace('components/queuepilot/completion.tsx',`{token&&<Dialog open onOpenChange={o=>!o&&setToken('')}><DialogContent><DialogHeader><DialogTitle>Save your API key</DialogTitle><DialogDescription>This secret is shown once. Copy it to your password manager; only its hash is stored.</DialogDescription></DialogHeader><Textarea readOnly value={token} aria-label="New API key"/><Button onClick={()=>setToken('')}>I’ve saved it</Button></DialogContent></Dialog>}`,`{token&&<OneTimeApiKey token={token} onDismiss={()=>setToken('')}/>}`);
replace('components/queuepilot/advanced.tsx','export function WorkspaceTools({navigate}:{navigate:(section:string)=>void})','export function WorkspaceTools({navigate,canManageApiKeys=false}:{navigate:(section:string)=>void;canManageApiKeys?:boolean})');
replace('components/queuepilot/advanced.tsx',"['timesheet','Weekly timesheet','Review and export your recorded work.']].map","['timesheet','Weekly timesheet','Review and export your recorded work.']].filter(([section])=>section!=='api'||canManageApiKeys).map");
replace('components/queuepilot/workspace.tsx','<WorkspaceTools navigate={setSection}/>',"<WorkspaceTools navigate={setSection} canManageApiKeys={can(data.organization,'organization:write')}/>");
replace('vite.config.ts','import { sites } from "./build/sites-vite-plugin";','import { sites } from "./build/sites-vite-plugin";\nimport { clientSecurity } from "./build/client-security.mjs";');
replace('vite.config.ts','      vinext(),\n      sites(),','      vinext(),\n      clientSecurity(),\n      sites(),');
replace('vite.pages.config.ts',"import react from '@vitejs/plugin-react';","import react from '@vitejs/plugin-react';\nimport {clientSecurity} from './build/client-security.mjs';");
replace('vite.pages.config.ts','  plugins:[{','  plugins:[clientSecurity(root),{');
console.log('Applied the five reviewed API-key display and build-boundary edits.');
