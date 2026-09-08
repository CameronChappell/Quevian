import {body,respond,service} from '@/lib/server/http';
import {HttpError} from '@/lib/server/service';
export const dynamic='force-dynamic';
export async function GET(){return respond(async()=> (await service()).account());}
export async function POST(request:Request){return respond(async()=>{const s=await service(),p=await body(request);if(p.action==='create'){const {action,...values}=p;return s.createOrganization(values)}if(p.action==='accept'){const {action,...values}=p;return s.acceptInvitation(values)}throw new HttpError(400,'Unknown account action.');});}
