import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('.',import.meta.url));
const base=process.env.PAGES_BASE_PATH || '/Quevian/';
const appOrigin='https://quevian.com';
export default defineConfig({
  root:root+'pages-preview',
  resolve:{alias:{'@':root}},
  base,
  publicDir:root+'public',
  plugins:[{
    name:'quevian-pages-links',
    closeBundle(){const html=readFileSync(root+'pages-dist/index.html','utf8');for(const page of ['product','how-it-works','customer-portal','faq','pricing']){mkdirSync(root+'pages-dist/'+page,{recursive:true});writeFileSync(root+'pages-dist/'+page+'/index.html',html.replace('<title>Quevian — Bring clarity to your service desk</title>','<title>'+page.replaceAll('-',' ')+' | Quevian</title>'))}},
    enforce:'pre',
    transform(code,id){
      if(id.endsWith('/components/marketing/policy-links.tsx')) return code.replace(/href="(\/[^\"]*)"/g,(_match,path)=>`href="${appOrigin}${path}"`);
      if(id.endsWith('/components/marketing/landing.tsx') || id.endsWith('/components/marketing/pricing.tsx')){
        return code.replace(/href="\/(product|how-it-works|customer-portal|faq|pricing)\/"/g,(_match,page)=>`href="${base}${page}/"`).replace(/href="(\/(?:login|signup|support|privacy|terms)[^"]*)"/g,(_match,path)=>`href="${appOrigin}${path}"`);
      }
      if(id.endsWith('/components/marketing/product-demo-media.ts')){
        return code.replaceAll('/media/',`${base}media/`);
      }
      if(id.endsWith('/components/marketing/brand.tsx')){
        return code.replace('href="/"',`href="${base}"`).replace('src="/quevian-logo.png',`src="${base}quevian-logo.png`);
      }
      if(id.endsWith('.css'))return code.replaceAll('url(/fonts/',`url(${base}fonts/`);
    }
  },react()],
  build:{outDir:root+'pages-dist',emptyOutDir:true},
});
