import {requireAccount} from '@/lib/auth/server';
import {WorkspaceApp} from '@/components/queuepilot/workspace';
export const dynamic='force-dynamic';
export const metadata={title:'Workspace | Quevian'};
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;const q=new URLSearchParams();for(const k of ['org','ticket','asset']){const v=params[k];if(typeof v==='string')q.set(k,v)}return <Protected returnTo={'/app'+(q.size?'?'+q:'')}/>}
async function Protected({returnTo}:{returnTo:string}){await requireAccount(returnTo);return <WorkspaceApp/>}
