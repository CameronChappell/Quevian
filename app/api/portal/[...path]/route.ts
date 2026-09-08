import {body,respond,service} from '@/lib/server/http';
import {documentRequest} from '@/lib/server/documents';
import {fileRequest} from '@/lib/server/files';
import {HttpError} from '@/lib/server/service';
type Context={params:Promise<{path:string[]}>};
export const dynamic='force-dynamic';
export async function GET(request:Request,ctx:Context){return respond(async()=>{const s=await service(),[org,company,ticket,action,fileId]=(await ctx.params).path;if(ticket==='documents')return documentRequest(s,request,org,'company',company,action,true);if(action==='files')return fileRequest(s,request,org,Number(ticket),fileId,company);if(!company)throw new HttpError(404,'Not found.');return ticket?s.portalTicket(org,company,Number(ticket)):s.portalData(org,company,new URL(request.url));});}
export async function POST(request:Request,ctx:Context){return respond(async()=>{const s=await service(),[org,company,ticket,action,fileId]=(await ctx.params).path;if(action==='files')return fileRequest(s,request,org,Number(ticket),fileId,company);const p=await body(request);if(!company)throw new HttpError(404,'Not found.');return ticket?s.reply(org,Number(ticket),p,company):s.portalCreate(org,company,p);});}
