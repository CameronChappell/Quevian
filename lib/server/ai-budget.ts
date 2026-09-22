import {HttpError} from './service';

export function aiBudgetPlan(env: Record<string, string|undefined>) {
  const amount = (key: string) => /^\d{1,9}$/.test(env[key] ?? '') ? Number(env[key]) : 0;
  const limit = amount('QUEVIAN_AI_MONTHLY_BUDGET_CENTS');
  const reservation = amount('QUEVIAN_AI_REQUEST_RESERVATION_CENTS');
  return {limit, reservation, ready: limit > 0 && reservation > 0 && reservation <= limit};
}

/** Global, atomic and fail-closed. Failed/uncertain calls are never refunded.
 * This caps configured reservations, not the provider's invoice. Keep the
 * default zero budget until a conservative per-call envelope is approved.
 */
export async function reserveAiBudget(db: D1Database, env: Record<string, string|undefined>, now = new Date()) {
  const plan = aiBudgetPlan(env);
  if (!plan.ready) throw new HttpError(503, 'AI is disabled until its spending budget is configured.');
  // auth_limits cleanup uses 15-minute units. A month-end expiry keeps the
  // current month's reservation counter from being deleted by auth cleanup.
  const expires = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1) / 900000);
  const row = await db.prepare('INSERT INTO auth_limits(key,window,count) VALUES(?,?,?) ON CONFLICT(key) DO UPDATE SET window=excluded.window,count=CASE WHEN auth_limits.window=excluded.window THEN auth_limits.count+excluded.count ELSE excluded.count END WHERE (CASE WHEN auth_limits.window=excluded.window THEN auth_limits.count ELSE 0 END)+excluded.count<=? RETURNING count').bind('security:openai:monthly-reservation:' + now.toISOString().slice(0,7), expires, plan.reservation, plan.limit).first<{count: number}>();
  if (!row) throw new HttpError(429, 'The configured AI spending allowance has been reached. Contact the service owner.');
}
