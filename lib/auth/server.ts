import {createServerClient} from '@supabase/ssr';
import {cookies,headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {env} from 'cloudflare:workers';
import {authConfig,authReady} from './config';
import {authenticatedIdentity} from '@/lib/server/identity';
import type {Identity} from '@/lib/domain';
import {HttpError} from '@/lib/server/service';
export async function authClient(){const c=authConfig();if(!c.url||!c.key)throw new HttpError(503,'Account sign-in is not configured yet.');const jar=await cookies();return createServerClient(c.url,c.key,{cookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'},cookies:{getAll:()=>jar.getAll(),setAll(values){try{values.forEach(({name,value,options})=>jar.set(name,value,options))}catch{/* Middleware persists refreshed sessions for Server Components. */}}}})}
export async function verifiedUser(){if(!authReady())return null;const client=await authClient();const {data,error}=await client.auth.getUser();if(error||!data.user?.email||!data.user.email_confirmed_at||data.user.is_anonymous)return null;return data.user}
export async function accountIdentity():Promise<Identity|null>{const user=await verifiedUser();if(user){if(!env.DB)throw new HttpError(503,'Shared storage is unavailable.');const mapped=await env.DB.prepare('SELECT user_id FROM auth_links WHERE subject=?').bind(user.id).first<{user_id:string}>();return {id:mapped?.user_id??'supabase:'+user.id,email:user.email!.toLowerCase(),name:typeof user.user_metadata?.full_name==='string'?user.user_metadata.full_name.slice(0,120):user.email!}}
return authenticatedIdentity(await headers());}
export function safeNext(value:unknown,fallback='/app'){if(typeof value!=='string')return fallback;try{const u=new URL(value,'https://quevian.invalid');if(u.origin!=='https://quevian.invalid'||!(['/app','/portal','/auth/link'].includes(u.pathname)||/^\/invite\/[a-zA-Z0-9-]{1,150}$/.test(u.pathname)))return fallback;return u.pathname+u.search}catch{return fallback}}
export async function requireAccount(next:string){const user=await accountIdentity();if(!user)redirect('/login?next='+encodeURIComponent(safeNext(next)));return user}
