// Platform bindings are checked at runtime; local tooling may not provide them.
declare namespace Cloudflare {
  interface Env { DB?: D1Database; BUCKET?: R2Bucket }
}

declare namespace Cloudflare { interface Env {SUPABASE_URL?:string;SUPABASE_PUBLISHABLE_KEY?:string;QUEVIAN_SITE_URL?:string;QUEVIAN_EMAIL_AUTH_ENABLED?:string;RESEND_API_KEY?:string;QUEVIAN_EMAIL_FROM?:string;} }
