import {AuthEntry} from '@/components/marketing/auth-entry';
export const dynamic='force-dynamic';
export const metadata={title:'Log in | Quevian'};
export default async function Page({searchParams}:{searchParams:Promise<{role?:string;next?:string}>}){const {role,next}=await searchParams;return <AuthEntry customer={role==='customer'} next={next}/>}
