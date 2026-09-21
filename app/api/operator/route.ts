import {respond,service} from '@/lib/server/http';
import {operatorOverview} from '@/lib/server/operator';
export const dynamic='force-dynamic';
export async function GET(){return respond(async()=>operatorOverview(await service()))}
