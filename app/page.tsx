import {Landing} from '@/components/marketing/landing';
import {redirect} from 'next/navigation';
export const metadata={title:'Quevian — Bring clarity to your service desk',description:'Tickets, customers, projects, and team schedules. One focused workspace for IT service teams.'};
export default async function Home({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){const params=await searchParams;if(params.org||params.ticket||params.asset){const q=new URLSearchParams();for(const [k,v] of Object.entries(params))if(typeof v==='string')q.set(k,v);redirect('/app?'+q)}return <Landing/>}
