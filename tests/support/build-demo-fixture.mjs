import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const dir='public/__audit__';
await mkdir(dir,{recursive:true});
await build({entryPoints:['tests/support/demo-fixture.tsx'],bundle:true,format:'esm',platform:'browser',outfile:dir+'/demo.js',define:{'process.env.NODE_ENV':'"development"'}});
await writeFile(dir+'/demo.html','<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module" src="/__audit__/demo.js"></script></body></html>');
await writeFile(dir+'/demo-capture.html','<!doctype html><html><body style="margin:0;background:#fff"><iframe title="Quevian demo capture" src="/__audit__/demo.html?org=demo&ticket=1001" style="display:block;width:1280px;height:720px;border:0"></iframe></body></html>');
await writeFile(dir+'/demo-followup.html',(await readFile(dir+'/demo-capture.html','utf8')).replace('ticket=1001','ticket=1007&stage=assigned'));
console.log('Capture fixture: /__audit__/demo-capture.html. Remove public/__audit__ before publishing.');
