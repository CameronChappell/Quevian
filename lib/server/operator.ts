import {env} from 'cloudflare:workers';
import {Service,HttpError} from './service';
import {health} from './jobs';
export function isOperator(s:Service){return !!(env as unknown as {QUEVIAN_OPERATOR_ID?:string}).QUEVIAN_OPERATOR_ID&&s.user.id===(env as unknown as {QUEVIAN_OPERATOR_ID?:string}).QUEVIAN_OPERATOR_ID}
export async function operatorOverview(s:Service){if(!isOperator(s))throw new HttpError(403,'Operator access is required.');return {...await health(s.db),requests:await s.rows('SELECT p.id,p.kind,p.status,p.created,o.name organization,u.email FROM privacy_requests p JOIN organizations o ON o.id=p.org_id JOIN users u ON u.id=p.user_id ORDER BY p.created DESC LIMIT 50'),mail:await s.rows("SELECT status,COUNT(*) count FROM mail_outbox WHERE status IN ('retry','review','bounced','failed','complained') GROUP BY status"),attachments:await s.rows("SELECT status,COUNT(*) count FROM mail_attachment_imports WHERE status IN ('retry','review','skipped') GROUP BY status")}}
