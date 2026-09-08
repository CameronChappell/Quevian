import {AccountPage} from '@/components/marketing/account-page';
import {verifiedUser} from '@/lib/auth/server';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export const metadata={title:'Choose a new password | Quevian'};
export default async function Page(){if(!await verifiedUser())redirect('/forgot-password');return <AccountPage title="Choose a new password." description="Once your password is updated, sign in again with your new password." mode="reset"/>}
