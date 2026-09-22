import {env} from 'cloudflare:workers';
import {isHttpsOrigin, isPrivilegedSupabaseKey} from '../runtime-security';
export function authConfig(){return {url:env.SUPABASE_URL??'',key:env.SUPABASE_PUBLISHABLE_KEY??'',site:env.QUEVIAN_SITE_URL??'',enabled:env.QUEVIAN_EMAIL_AUTH_ENABLED==='true'}}
export function authReady(){const c=authConfig();return Boolean(c.enabled && isHttpsOrigin(c.url) && isHttpsOrigin(c.site) && c.key && !isPrivilegedSupabaseKey(c.key))}
