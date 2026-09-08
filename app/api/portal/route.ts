import {respond,service} from '@/lib/server/http';
export const dynamic='force-dynamic';
export async function GET(){return respond(async()=> (await service()).portalAccount());}
