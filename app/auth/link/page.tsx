import {headers} from 'next/headers';
import {AccountPage} from '@/components/marketing/account-page';
import {authenticatedIdentity} from '@/lib/server/identity';
import {verifiedUser} from '@/lib/auth/server';
import {chatGPTSignInPath} from '@/app/chatgpt-auth';
export const dynamic='force-dynamic';
export default async function Page(){const legacy=await authenticatedIdentity(await headers()),user=await verifiedUser();if(!legacy)return <div className="welcome"><h1>Connect your existing workspace</h1><p>First, sign in with the ChatGPT account you used for Quevian.</p><a href={chatGPTSignInPath('/auth/link')} target="_top">Continue with ChatGPT</a></div>;if(!user)return <div className="welcome"><h1>Connect your email account</h1><p>Create and verify an email account using {legacy.email}, then return here to link your workspace.</p><a href="/signup?next=/auth/link">Create email account</a><p><a href="/login?next=/auth/link">Already registered? Log in</a></p></div>;return <AccountPage title="Keep your existing workspace." description={`Link your verified email account (${user.email}) to the workspace associated with your ChatGPT account (${legacy.email}). Tickets, team roles, and history will stay in place.`} mode="link"/>}
