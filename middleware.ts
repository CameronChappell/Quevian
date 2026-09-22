import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';
import {authConfig,authReady} from './lib/auth/config';
import {applySecurityHeaders} from './lib/security-policy';
export async function middleware(request:NextRequest){
 let response=NextResponse.next({request});
 const secure=()=>applySecurityHeaders(response.headers,new URL(request.url));secure();
 if(!authReady())return response;
 const c=authConfig();
 const client=createServerClient(c.url,c.key,{cookieOptions:{httpOnly:true,secure:true,sameSite:'lax',path:'/'},cookies:{
  getAll:()=>request.cookies.getAll(),
  setAll(values,cacheHeaders){
   values.forEach(({name,value})=>request.cookies.set(name,value));response=NextResponse.next({request});
   values.forEach(({name,value,options})=>response.cookies.set(name,value,{...options,httpOnly:true,secure:true,sameSite:'lax',path:'/'}));
   Object.entries(cacheHeaders??{}).forEach(([key,value])=>response.headers.set(key,value));secure();
  }
 }});
 try{await client.auth.getUser()}catch{/* Protected routes independently verify identity and fail closed. */}
 return response;
}
export const config={matcher:['/app/:path*','/portal/:path*','/login','/signup','/forgot-password','/reset-password','/auth/:path*','/logout','/verify-email','/invite/:path*','/review-terms','/api/auth/:path*','/api/legal','/api/account','/api/operator','/api/workspace/:path*','/api/portal/:path*']};
