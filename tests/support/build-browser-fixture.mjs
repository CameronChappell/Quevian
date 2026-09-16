import {build} from 'esbuild';
import {mkdir,writeFile} from 'node:fs/promises';
const dir='public/__audit__';
await mkdir(dir,{recursive:true});
await build({entryPoints:['tests/support/browser-fixture.tsx'],bundle:true,format:'esm',platform:'browser',outfile:dir+'/fixture.js',define:{'process.env.NODE_ENV':'"development"'}});
await writeFile(dir+'/index.html','<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module" src="/\u005f\u005faudit__/fixture.js"></script></body></html>');
await writeFile(dir+'/mobile.html','<!doctype html><html><body style="margin:0;background:#eee"><iframe title="Mobile ticketing fixture" src="/\u005f\u005faudit__/index.html" style="width:390px;height:844px;border:0"></iframe></body></html>');
console.log('Temporary UI fixture ready. Remove public/__audit__ before production builds.');
