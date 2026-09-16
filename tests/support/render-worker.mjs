import {build} from 'esbuild';

globalThis.__qvRenderedEnv={};
const built=await build({entryPoints:['dist/server/index.js'],bundle:true,format:'esm',platform:'node',write:false,plugins:[{name:'runtime-binding',setup(b){b.onResolve({filter:/^cloudflare:workers$/},a=>({path:a.path,namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},()=>({contents:'export const env=globalThis.__qvRenderedEnv;',loader:'js'}));}}]});
export const {default:worker}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text+'\n//# sourceURL=rendered-worker.mjs').toString('base64'));
export const env={ASSETS:{fetch:async()=>new Response('Not found',{status:404})}};
export const ctx={waitUntil(){},passThroughOnException(){}};
export const request=(path,headers={})=>worker.fetch(new Request('http://localhost'+path,{headers:{accept:'text/html',...headers}}),env,ctx);
