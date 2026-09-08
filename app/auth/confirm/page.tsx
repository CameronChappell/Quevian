import {AccountPage} from '@/components/marketing/account-page';
import {safeNext} from '@/lib/auth/server';
export const dynamic='force-dynamic';
export const metadata={title:'Confirm your email | Quevian',referrer:'no-referrer' as const};
export default async function Page({searchParams}:{searchParams:Promise<{token_hash?:string;type?:string;next?:string}>}){const p=await searchParams;return <AccountPage title={p.type==='recovery'?'Reset your password.':'Confirm your email.'} description={p.token_hash?'Continue to verify this email link. Links can only be used once.':'This link is incomplete or unsupported. Return to login to request a new verification or password-reset email.'} mode="confirm" tokenHash={p.token_hash??''} tokenType={p.type??'email'} next={safeNext(p.next)}/>}
