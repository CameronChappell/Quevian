import {env} from 'cloudflare:workers';
export function authConfig(){return {url:env.SUPABASE_URL??'',key:env.SUPABASE_PUBLISHABLE_KEY??'',site:env.QUEVIAN_SITE_URL??'',enabled:env.QUEVIAN_EMAIL_AUTH_ENABLED==='true'}}
export function authReady(){const c=authConfig();return Boolean(c.enabled&&c.url&&c.key&&c.site)}
