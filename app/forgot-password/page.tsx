import {AccountPage} from '@/components/marketing/account-page';
export const dynamic='force-dynamic';
export const metadata={title:'Reset your password | Quevian'};
export default function Page(){return <AccountPage title="Forgot your password?" description="Enter your account email and we’ll send a link to reset your password." mode="forgot"/>}
