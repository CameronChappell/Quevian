import {body,respond,service} from '@/lib/server/http';
import {acceptTerms} from '@/lib/server/legal';
export const dynamic='force-dynamic';
export async function POST(request:Request){return respond(async()=>{const p=await body(request,4096);return acceptTerms(await service({allowPolicyReview:true}),p)})}
