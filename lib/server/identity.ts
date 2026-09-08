import type {Identity} from '../domain';

/** Read only dispatcher-authenticated identity headers on the server.
 * Some private Sites dispatchers supply email/name without the optional user ID.
 * Keep the fallback deterministic and namespaced; never accept a form/query identity.
 * A changed email on an email-only dispatcher represents a different account.
 */
export async function authenticatedIdentity(h:Pick<Headers,'get'>):Promise<Identity|null> {
  const email=h.get('oai-authenticated-user-email')?.trim().toLowerCase();
  if(!email)return null;
  let id=h.get('oai-authenticated-user-id')?.trim();
  if(!id){
    const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(email));
    id='sites-email:'+Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
  }
  let name=email;
  const raw=h.get('oai-authenticated-user-full-name');
  if(raw&&h.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){
    try{name=decodeURIComponent(raw).trim()||email}catch{}
  }
  return {id,email,name};
}
