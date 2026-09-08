import {service} from '@/lib/server/http';
import {accountIdentity} from '@/lib/auth/server';
import {redirect} from 'next/navigation';
import {InviteAccept} from '@/components/marketing/invite-accept';
import {Brand} from '@/components/marketing/brand';
import '@/components/marketing/marketing.css';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){const {id}=await params;return <Invitation id={id}/>}
async function Invitation({id}:{id:string}){if(!await accountIdentity())redirect('/login?next='+encodeURIComponent('/invite/'+id));const s=await service();const invitation=await s.one<{id:string;name:string;role:string;expires:string}>('SELECT i.id,o.name,i.role,i.expires FROM invitations i JOIN organizations o ON o.id=i.org_id WHERE i.id=? AND i.email=? AND i.expires>?',id,s.user.email,new Date().toISOString());return <div className="qv-site qv-account-page"><header><Brand/><a href="/logout">Change account</a></header><main>{invitation?<><h1>Join {invitation.name}</h1><p>You’ve been invited as {invitation.role.toLowerCase()}. Signed in as {s.user.email}.</p><InviteAccept id={id}/></>:<><h1>Invitation unavailable</h1><p>This invitation may have expired, been replaced, or been revoked. Make sure you’re signed in with the invited email, or ask your administrator for a new invitation.</p><a href="/app">Open workspace</a></>}</main></div>}
