import {HttpError} from './service';

/** All entries share the 15-minute unit used by auth_limits cleanup. */
export async function limitAccountRequest(db: D1Database, accountId: string, scope: 'api'|'upload'|'download'|'password-reset', now = Date.now()): Promise<void> {
  const limits = {api: 2400, upload: 30, download: 300, 'password-reset': 10};
  const maximum = limits[scope];
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('request:' + scope + ':' + accountId));
  const key = Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2, '0')).join('');
  const window = Math.floor(now / 900000);
  const row = await db.prepare('INSERT INTO auth_limits(key,window,count) VALUES(?,?,1) ON CONFLICT(key) DO UPDATE SET window=excluded.window,count=CASE WHEN auth_limits.window=excluded.window THEN MIN(auth_limits.count+1,?) ELSE 1 END RETURNING count').bind(key, window, maximum + 1).first<{count: number}>();
  if (!row || row.count > maximum) throw new HttpError(429, 'Too many requests. Please wait before trying again.');
}
