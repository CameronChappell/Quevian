import {z} from 'zod';
import {TERMS_VERSION,PRIVACY_VERSION} from '../legal';
import {Service} from './service';

export const policyAcceptance=z.object({
 acceptedTerms:z.literal(true),
 acknowledgedPrivacy:z.literal(true),
 adultAndAuthorized:z.literal(true),
 termsVersion:z.literal(TERMS_VERSION),
 privacyVersion:z.literal(PRIVACY_VERSION),
});
export async function hasAcceptedTerms(db:D1Database,userId:string){
 return !!await db.prepare('SELECT 1 FROM legal_acceptances WHERE user_id=? AND terms_version=? LIMIT 1').bind(userId,TERMS_VERSION).first();
}
export async function acceptTerms(s:Service,payload:unknown){
 const p=policyAcceptance.strict().parse(payload);
 await s.register();
 await s.stmt('INSERT INTO legal_acceptances(user_id,terms_version,privacy_version,accepted_at) VALUES(?,?,?,?) ON CONFLICT(user_id,terms_version) DO NOTHING',s.user.id,p.termsVersion,p.privacyVersion,new Date().toISOString()).run();
 return {ok:true,termsVersion:TERMS_VERSION};
}
