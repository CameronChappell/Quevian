import {env} from 'cloudflare:workers';
import {health,authorizeJob} from '@/lib/server/jobs';
export const dynamic='force-dynamic';
export async function GET(request:Request){try{if(!env.DB)throw new Error();const result=await health(env.DB);let details=false;try{await authorizeJob(request);details=true}catch{}return Response.json({status:result.healthy?'ok':'degraded',...(details?{jobs:result.jobs}:{})},{status:result.healthy?200:503,headers:{'Cache-Control':'no-store'}})}catch{return Response.json({status:'unavailable'},{status:503,headers:{'Cache-Control':'no-store'}})}}
