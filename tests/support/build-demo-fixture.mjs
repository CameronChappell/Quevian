import {build} from 'esbuild';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
const dir='public/__audit__';
await mkdir(dir,{recursive:true});
await build({entryPoints:['tests/support/demo-fixture.tsx'],bundle:true,format:'esm',platform:'browser',outfile:dir+'/demo.js',define:{'process.env.NODE_ENV':'"development"'}});
await writeFile(dir+'/demo.html','<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app/globals.css"></head><body><div id="root"></div><script type="module" src="/__audit__/demo.js"></script></body></html>');
await writeFile(dir+'/demo-capture.html','<!doctype html><html><body style="margin:0;background:#fff"><iframe title="Quevian demo capture" src="/__audit__/demo.html?org=demo&ticket=1001" style="display:block;width:1280px;height:720px;border:0"></iframe></body></html>');
await writeFile(dir+'/demo-followup.html',(await readFile(dir+'/demo-capture.html','utf8')).replace('ticket=1001','ticket=1007&stage=assigned'));
// 1600×900 logical workspace captured at 2560×1440 for readable video text.
await writeFile(dir+'/demo-hd.html',(await readFile(dir+'/demo.html','utf8')).replace('</head>','<style>html{zoom:1.6}body{margin:0}*{cursor:none!important}*:focus-visible{outline:none!important}textarea{resize:none!important}</style></head>'));
await writeFile(dir+'/demo-hd-capture.html','<!doctype html><html><body style="margin:0;width:2560px;height:1440px;overflow:hidden;background:white"><iframe title="High resolution Quevian capture" src="/__audit__/demo-hd.html?org=demo" style="display:block;width:2560px;height:1440px;border:0"></iframe></body></html>');
console.log('Capture fixture: /__audit__/demo-capture.html. Remove public/__audit__ before publishing.');
