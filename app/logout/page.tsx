import {AccountPage} from '@/components/marketing/account-page';
import {authReady} from '@/lib/auth/config';
import {redirect} from 'next/navigation';
export const dynamic='force-dynamic';
export default function Page(){if(!authReady())redirect('/signout-with-chatgpt?return_to=/login');return <AccountPage title="Sign out of Quevian?" description="You can sign back in whenever you’re ready." mode="logout"/>}
