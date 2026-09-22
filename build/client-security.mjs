import {readdirSync,readFileSync} from 'node:fs';
import {relative,resolve} from 'node:path';

const patterns=[
  ['stripe-secret', /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
  ['webhook-secret', /\bwhsec_[A-Za-z0-9+/=_-]{24,}/],
  ['supabase-secret', /\bsb_secret_[A-Za-z0-9_-]{16,}\b/],
  ['resend-secret', /\bre_[A-Za-z0-9_]{24,}\b/],
  ['provider-secret', /\bsk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}\b/],
  ['workspace-api-key', /\bqp_[a-fA-F0-9]{64}\b/],
  ['private-key', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |ENCRYPTED )?PRIVATE KEY-----/],
];
const textFile=/\.(?:[cm]?js|jsx|tsx?|css|html?|json|txt|svg|xml|map)$/i;
const privateFile=/(?:^|\/)(?:\.env(?:\.[^/]*)?|\.dev\.vars(?:\.[^/]*)?|\.git(?:\/|$))|\.(?:map|pem|p12|pfx|key|db|sqlite3?)$/i;
const publicNames=new Set([
  'SUPABASE_PUBLISHABLE_KEY','SUPABASE_ANON_KEY','STRIPE_PUBLISHABLE_KEY',
]);
function baseName(name){return name.replace(/^(?:NEXT_PUBLIC_|VITE_|QUEVIAN_PUBLIC_)/,'');}
function secretName(name){
  return !publicNames.has(baseName(name))&&/(?:SECRET|PASSWORD|TOKEN|(?:^|_)KEY(?:_|$)|(?:^|_)KEYS$|DATABASE_URL|PRIVATE_KEY)/i.test(name);
}
/** Returns rule names only; never matched values or source excerpts. */
export function credentialFindings(text,values={}){
  const found=patterns.filter(([,pattern])=>pattern.test(text)).map(([name])=>name);
  for(const match of text.matchAll(/\beyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g)){
    try{if(JSON.parse(Buffer.from(match[0].split('.')[1],'base64url').toString()).role==='service_role')found.push('privileged-supabase-jwt');}catch{/* Not a decodable JWT. */}
  }
  for(const [name,value] of Object.entries(values)){
    if(secretName(name)&&typeof value==='string'&&value.length>=12&&text.includes(value))found.push('server-environment-value');
  }
  return [...new Set(found)];
}
export function assertPublicAsset(file,text,values={}){
  const rules=privateFile.test(file.replaceAll('\\','/'))?['private-deployment-file']:credentialFindings(file+'\n'+text,values);
  // Deliberately omit even filenames: an attacker could put a credential there.
  if(rules.length)throw new Error('Public asset rejected ('+rules.join(', ')+'). Secret values are not logged.');
}
export function assertPublicEnvironment(values){
  for(const [name,value] of Object.entries(values)){
    if(!/^(?:VITE_|NEXT_PUBLIC_|QUEVIAN_PUBLIC_)/.test(name)||!value)continue;
    if(secretName(name)||credentialFindings(String(value)).length){
      throw new Error('A public-prefixed environment variable contains a private credential. Move it to a server-only binding. Values are not logged.');
    }
  }
}
export function assertClientModules(moduleIds,root){
  for(const id of moduleIds){
    const normalized=id.replaceAll('\\','/').split('?')[0];
    const local=relative(root,normalized).replaceAll('\\','/');
    if(normalized.includes('cloudflare:workers')||/^(?:lib\/server\/|lib\/auth\/(?:config|server)\.[cm]?tsx?$|worker\/)/.test(local)){
      throw new Error('Server-only credential code entered a browser bundle. Import a public API client instead.');
    }
  }
}
export function scanPublicDirectory(directory,values={}){
  function walk(dir){
    for(const entry of readdirSync(dir,{withFileTypes:true})){
      const file=resolve(dir,entry.name),name=relative(directory,file).replaceAll('\\','/');
      if(entry.isSymbolicLink())throw new Error('Public-directory symlinks are not allowed.');
      if(privateFile.test(name))assertPublicAsset(name,'',values);
      if(entry.isDirectory())walk(file);
      else if(entry.isFile())assertPublicAsset(name,textFile.test(name)?readFileSync(file,'utf8'):'',values);
    }
  }
  walk(directory);
}
/** @returns {import('vite').Plugin} */
export function clientSecurity(sourceRoot=process.cwd()){
  let publicDir=false,values={};
  return {
    name:'quevian-client-secrets',apply:'build',enforce:'post',
    async configResolved(config){
      const {loadEnv}=await import('vite');
      publicDir=config.publicDir;
      values={...loadEnv(config.mode,config.envDir,''),...process.env,...config.env};
      assertPublicEnvironment(values);
    },
    buildStart(){if(publicDir)scanPublicDirectory(publicDir,values);},
    generateBundle(_options,bundle){
      if(this.environment.config.consumer==='server')return;
      for(const item of Object.values(bundle)){
        if(item.type==='chunk'){
          assertClientModules(item.moduleIds,sourceRoot);
          assertPublicAsset(item.fileName,item.code,values);
        }else{
          assertPublicAsset(item.fileName,textFile.test(item.fileName)?Buffer.from(item.source).toString('utf8'):'',values);
        }
      }
    },
  };
}
