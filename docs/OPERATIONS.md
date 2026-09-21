# Quevian operations

## Service health and jobs

The configured operator can open Service operations in the workspace sidebar. Other workspace owners cannot access global service operations. The view shows background-job status, mail exceptions and workspace deletion requests. Logs contain request IDs and generic error categories rather than message bodies or secrets.

/api/health exposes a minimal public health response. Authenticated job-token calls additionally report job status. Tokens are secrets in Site runtime and Supabase Vault; they are not application-user credentials.

The native Supabase pg_cron runner calls fixed application paths through pg_net. Active cadence: maintenance every 2 minutes, health every 5 minutes, backup daily at 03:15 UTC. Installation source is ops/quevian-job-runner.sql. Cron activation and first production outcomes are recorded in LAUNCH_READINESS.md.

Maintenance visits five organizations per run with a durable cursor. It runs due recurring tickets, timed rules, in-app notifications, saved-mail retries, attachment recovery and subscription reconciliation when billing is configured. Leases prevent overlapping copies. At greater organization counts, review cycle latency before increasing capacity; five organizations per two minutes is not an unlimited throughput claim. Email dispatch preserves its provider idempotency window and stops uncertain old delivery for review.

Health is degraded after a failed run, maintenance older than 15 minutes, or backup older than 36 hours. A running job with a recent successful completion does not falsely degrade health. Database unavailability returns unavailable. An hourly ChatGPT health watch checks the latest health response and cron configuration and notifies the owner on failures. It is an hourly check, not immediate paging or an uptime SLA. The owner must respond to alerts. pg_net response bodies are temporary; use the current health JSON job completion timestamps for daily backup freshness rather than expecting yesterday’s HTTP response to remain available.

## Recovery

Daily backups contain application schema and records plus immutable file bytes and SHA-256 checksums in the existing private R2 bucket. The manifest is written last; only a complete backup advances the latest pointer. Each scheduled backup verifies stored bytes. A synthetic backup has been restored into a separate SQLite file and verified with foreign-key/integrity checks and matching attachments. This is not a production disaster-recovery timing guarantee.

Current bounded capacity: 20,000 rows per table, 100,000 rows total, 50 MB serialized database snapshot, 1,000 files, 6 MB per file. Exceeding any limit fails visibly instead of silently omitting records. Upgrade the backup process before approaching these limits. Daily copies grow storage usage; no automatic deletion/retention policy is active.

Backups share the current provider/account failure domain. An independent copy to private Supabase storage and deletion of copies older than 30 days remain blocked pending explicit owner approval. No prohibited transfer or retention workaround has been installed.

For an approved recovery drill, obtain the selected manifest and object bytes through the protected recovery endpoint using the job secret from the secret manager. Never commit backup payloads, tokens or real customer records. Store files by their manifest sha256 in an isolated secured directory. Run:

    node scripts/restore-backup.mjs manifest.json NEW_RESTORE.sqlite OBJECT_DIRECTORY

The destination must not exist. The script creates a separate SQLite database and .files directory with an object-key index, validates integrity/foreign keys/checksums, and marks scheduler records for recovery review. Any error means the restore is incomplete; do not use it. Do not overwrite the production database as a verification step. Production restoration and file-key import require a separately reviewed recovery action, a verified current backup and a maintenance window. Provider credentials are restored through secret managers, never database dumps. Hold email jobs after recovery until outbox/provider state is reconciled, because recovery can roll back deduplication records.

## Incident response

1. Record time, affected workspace and request/job ID. Check Service operations and provider health. Do not paste customer content or secrets into logs.
2. Stop the affected dispatch or billing path if it risks duplicate delivery or charges; preserve data and the last verified backup. A code rollback does not roll back D1 schema or records.
3. For email errors, inspect saved status and Resend before retrying. Delivered means recipient-server acceptance. Check forwarding separately; never replace Google Workspace MX records.
4. For failed billing events, repair the provider/runtime configuration, then replay signed events or reconcile canonical subscription state. A checkout success URL alone never activates access.
5. Communicate the concrete impact and recovery status through the support mailbox with owner authorization. Escalate privacy/security events for a business/legal assessment based on actual facts.
6. Verify recovery through the original failing workflow, document the cause and corrective action, and resume jobs only when safe.

Workspace deletion: verify requester ownership, export requirement, subscription cancellation and applicable retention first. Review the data scope and backup copies; obtain approval before erasing production data. Operator requests are a review queue, not a promise of automatic deletion.

Supabase Auth advisor currently reports leaked-password protection disabled. Enable that setting in the project Auth security settings, then verify password reset/sign-in with an owner-controlled account. Review provider limits, billing usage and account recovery/MFA before inviting customers.
