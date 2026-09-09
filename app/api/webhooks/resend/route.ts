import {handleMailWebhook} from '@/lib/server/ticket-mail';
import {respond} from '@/lib/server/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){return respond(()=>handleMailWebhook(request));}
