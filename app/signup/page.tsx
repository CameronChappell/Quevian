import {AuthEntry} from '@/components/marketing/auth-entry';
export const dynamic='force-dynamic';
export const metadata={title:'Get started | Quevian'};
export default async function Page({searchParams}:{searchParams:Promise<{next?:string}>}){const {next}=await searchParams;return <AuthEntry signup next={next}/>}
