import {env} from 'cloudflare:workers';
import {respond} from '@/lib/server/http';
import {billingWebhook} from '@/lib/server/subscriptions';
import {HttpError} from '@/lib/server/service';
export const dynamic='force-dynamic';
export async function POST(request:Request){return respond(async()=>{if(!env.DB)throw new HttpError(503,'Storage unavailable.');return billingWebhook(request,env.DB)})}
