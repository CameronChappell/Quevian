import {env} from 'cloudflare:workers';
import {respond} from '@/lib/server/http';
import {authorizeJob,runJob} from '@/lib/server/jobs';
import {HttpError} from '@/lib/server/service';
export const dynamic='force-dynamic';
export async function POST(request:Request,context:{params:Promise<{task:string}>}){return respond(async()=>{await authorizeJob(request);const {task}=await context.params;if(task!=='maintenance'&&task!=='backup')throw new HttpError(404,'Job not found.');if(!env.DB)throw new HttpError(503,'Database unavailable.');return runJob(env.DB,task)})}
