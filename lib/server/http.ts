import {env} from 'cloudflare:workers';
import {ZodError} from 'zod';
import {HttpError} from './service';
import {Completion} from './completion';
import {accountIdentity} from '../auth/server';
import {hasAcceptedTerms} from './legal';
import {guardMutation, parseObjectJson, readBoundedBody, SecurityViolation} from '../security-policy';
import {limitAccountRequest} from './request-limits';
export async function service({allowPolicyReview=false}:{allowPolicyReview?:boolean}={}){
  const user=await accountIdentity();
  if(!user)throw new HttpError(401,'Sign in to continue.');
  if(!env.DB)throw new HttpError(503,'Shared storage is not available yet. Please try again shortly.');
  await limitAccountRequest(env.DB,user.id,'api');
  if(!allowPolicyReview&&!await hasAcceptedTerms(env.DB,user.id))throw new HttpError(428,'Review and accept the current service terms at /review-terms before continuing.');
  return new Completion(env.DB,user);
}
export async function body(request:Request,limit=32768){
  guardMutation(request);
  if(request.headers.get('content-type')?.split(';')[0].trim().toLowerCase()!=='application/json')throw new HttpError(415,'Expected JSON.');
  return parseObjectJson(await readBoundedBody(request,limit));
}
export async function respond(action:()=>Promise<unknown>){try{const result=await action();return result instanceof Response?result:Response.json(result,{headers:{'Cache-Control':'private, no-store'}})}catch(e){let status=500,message='The request could not be completed. Please try again.';if(e instanceof HttpError||e instanceof SecurityViolation){status=e.status;message=e.message}else if(e instanceof ZodError){status=400;message=e.issues.slice(0,10).map(i=>`${i.path.join('.')||'Form'}: ${i.message}`).join('; ').slice(0,2000)}else if(e instanceof Error&&/subscription_seat_capacity/.test(e.message)){status=409;message='Add a subscription seat before adding or restoring another team member.'}else if(e instanceof Error&&/contact_location|plan_currency|contact_asset|document_company|invoice_/.test(e.message)){status=409;message='The linked company, project currency, or invoice amount conflicts with another record. Reload before saving.'}else if(e instanceof Error&&/dependency_|relation_/.test(e.message)){status=409;message=/cycle/.test(e.message)?'This dependency would create a cycle.':/completed/.test(e.message)?'Reopen dependent tasks first.':/incomplete/.test(e.message)?'Complete prerequisite tasks first.':'Related records must belong to the same project or company.'}else if(e instanceof Error&&/schedule_overlap/.test(e.message)){status=409;message='This member already has scheduled work at that time. Choose another time or member.'}else if(e instanceof Error&&/time_overlap/.test(e.message)){status=409;message='This time overlaps an existing entry. Correct the time range before saving.'}else if(e instanceof Error&&/running_timers/.test(e.message)){status=409;message='A timer is already running. Stop it before starting another.'}else if(e instanceof Error&&/UNIQUE constraint failed/.test(e.message)){status=409;message='A record with that name already exists in this organization.'}else if(e instanceof Error&&/FOREIGN KEY constraint failed/.test(e.message)){status=409;message='A related record changed. Refresh and try again.'}const requestId=crypto.randomUUID();if(status>=500)console.error(JSON.stringify({event:'request_failed',requestId,errorName:e instanceof Error?e.name:'Unknown'}));return Response.json({error:message,...(status>=500?{requestId}:{})},{status,headers:{'Cache-Control':'private, no-store','X-Request-ID':requestId,...(status===429?{'Retry-After':'900'}:{})}})}}
