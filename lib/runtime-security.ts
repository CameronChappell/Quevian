/** Presence/shape checks only. Never include configuration values in output. */
export function isHttpsOrigin(value: string): boolean {
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'; }
  catch { return false; }
}
export function isPrivilegedSupabaseKey(key: string): boolean {
  if (/^(?:sb_secret_|sk_|service_role)/.test(key)) return true;
  if (key.split('.').length !== 3) return false;
  try {
    const part = key.split('.')[1].replaceAll('-', '+').replaceAll('_', '/');
    const claims = JSON.parse(atob(part.padEnd(Math.ceil(part.length / 4) * 4, '=')));
    // This decodes a key's privilege class, never authenticates a user or JWT.
    return claims.role !== 'anon';
  } catch { return true; }
}
export function runtimeSecurityProblems(env: Record<string, unknown>): string[] {
  const text = (key: string) => typeof env[key] === 'string' ? env[key] as string : '';
  const problems: string[] = [];
  for (const key of Object.keys(env)) {
    if (/^(NEXT_PUBLIC_|VITE_)/.test(key) && /(?:SECRET|PASSWORD|PRIVATE|SERVICE_ROLE|JOB_TOKEN|RESEND_API_KEY|OPENAI_KEY|STRIPE.*KEY)/.test(key) && text(key)) problems.push(key + ': must not be exposed to browser bundles');
  }
  if (text('QUEVIAN_EMAIL_AUTH_ENABLED') === 'true') {
    for (const key of ['SUPABASE_URL', 'QUEVIAN_SITE_URL']) if (!isHttpsOrigin(text(key))) problems.push(key + ': requires an HTTPS origin without a path');
    if (!text('SUPABASE_PUBLISHABLE_KEY') || isPrivilegedSupabaseKey(text('SUPABASE_PUBLISHABLE_KEY'))) problems.push('SUPABASE_PUBLISHABLE_KEY: requires a non-privileged public key');
    if (!text('QUEVIAN_EMAIL_FROM')) problems.push('QUEVIAN_EMAIL_FROM: verified sender must be configured');
  }
  if (text('QUEVIAN_JOBS_ENABLED') === 'true') {
    if (text('QUEVIAN_JOB_TOKEN').length < 32) problems.push('QUEVIAN_JOB_TOKEN: requires at least 32 characters');
    if (!text('QUEVIAN_OPERATOR_ID')) problems.push('QUEVIAN_OPERATOR_ID: requires an explicitly verified operator identity');
  }
  if (text('QUEVIAN_BILLING_ENABLED') === 'true') {
    if (text('QUEVIAN_LEGAL_APPROVED') !== 'true') problems.push('QUEVIAN_LEGAL_APPROVED: approval is required before billing activation');
    for (const key of ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_MONTHLY_PRICE_ID', 'STRIPE_ANNUAL_PRICE_ID', 'STRIPE_PORTAL_CONFIGURATION_ID']) if (!text(key)) problems.push(key + ': required for billing');
  }
  return problems;
}
