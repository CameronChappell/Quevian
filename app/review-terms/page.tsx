import {env} from 'cloudflare:workers';
import {redirect} from 'next/navigation';
import {accountIdentity,safeNext} from '@/lib/auth/server';
import {Completion} from '@/lib/server/completion';
import {hasAcceptedTerms} from '@/lib/server/legal';
import {ServicePage} from '@/components/marketing/service-pages';
import {LegalConsent} from '@/components/marketing/legal-consent';
import {LegalAccountControls} from '@/components/marketing/legal-account-controls';
import {POLICY_DATE} from '@/lib/legal';
export const dynamic='force-dynamic';
export const metadata={title:'Review the service terms | Quevian',robots:{index:false,follow:false}};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){
 const next=safeNext((await searchParams).next),user=await accountIdentity();
 if(!user)redirect('/login?next='+encodeURIComponent(next));
 if(!env.DB)throw new Error('Shared storage is unavailable.');
 if(await hasAcceptedTerms(env.DB,user.id))redirect(next);
 const account=await new Completion(env.DB,user).account();
 return <ServicePage title="Before you continue"><p>Review the service terms and data practices, effective {POLICY_DATE}, for your Quevian account. They apply to staff and customer-portal access.</p><p>Signed in as {user.email}. <a href="/logout">Sign out</a></p><LegalConsent next={next}/><LegalAccountControls organizations={account.organizations}/><p><a href="/">Return to the website</a></p></ServicePage>
}
