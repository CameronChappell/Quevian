import {service,respond} from '@/lib/server/http';
import {HttpError} from '@/lib/server/service';
export async function GET(request:Request,ctx:{params:Promise<{path:string[]}>}){return respond(async()=>{const s=await service(),[org,resource]=(await ctx.params).path;if(!['tickets','events'].includes(resource))throw new HttpError(404,'Not found.');await s.verifyKey(org,(request.headers.get('authorization')??'').replace(/^Bearer /,''),resource+':read');return resource==='tickets'?s.listTickets(org,new URL(request.url)):s.eventFeed(org,new URL(request.url));});}
