import {requireAccount} from '@/lib/auth/server';
import {Portal} from '@/components/queuepilot/portal';
export const dynamic='force-dynamic';
export default async function Page(){await requireAccount('/portal');return <Portal/>;}
