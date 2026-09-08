import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const base=process.env.PAGES_BASE_PATH || '/Quevian/';
const appOrigin='https://queuepilot.boomacooks.chatgpt.site';
export default defineConfig({
  root:root+'pages-preview',
  base,
  publicDir:root+'public',
  plugins:[{
    name:'quevian-pages-links',
    enforce:'pre',
    transform(code,id){
      if(id.endsWith('/components/marketing/landing.tsx')){
        return code.replace(/href="(\/(?:login|signup)[^"]*)"/g,(_match,path)=>`href="${appOrigin}${path}"`);
      }
      if(id.endsWith('/components/marketing/brand.tsx')){
        return code.replace('href="/"',`href="${base}"`).replace('src="/quevian-logo.png',`src="${base}quevian-logo.png`);
      }
      if(id.endsWith('.css'))return code.replaceAll('url(/fonts/',`url(${base}fonts/`);
    }
  },react()],
  build:{outDir:root+'pages-dist',emptyOutDir:true},
});
