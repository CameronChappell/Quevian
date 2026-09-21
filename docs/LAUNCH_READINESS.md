# Quevian launch readiness — September 21, 2026

The current release completes the application work listed below. Paid launch remains blocked by owner-controlled provider setup and business decisions; this is not a claim that every advanced feature from older plans is implemented.

## Completed and verified

- Working Google Workspace → Resend → ticket → delivered staff reply → same-ticket customer reply. Live ticket #1051 verified, duplicate replay deduplicated.
- Customer-visible incoming/outgoing email attachments with size/type/host checks, explicit outgoing selection, company boundaries, merge handling, visible import failures and saved retries. Local provider simulations and browser flow passed; real attachment acceptance needs an owner test email.
- Subscription checkout, billing portal, signed webhooks, provider-state reconciliation, consent, seat counts, suspension and configurable paid access. Payments are disabled until the account/policy gates below pass. Simulated-provider tests passed; no real purchase was made.
- Existing sessions lose workspace access when a staff member is suspended. Historical records remain intact. Customer portal and organization boundaries have regression coverage.
- Background-job routes, durable leases, retries, health endpoint and operator-only service operations.
- Complete database/file snapshots with checksums in existing private storage, plus a tested restore script that writes only to a new isolated database. Independent offsite archival and deletion are not installed.
- Owner business-record export and verified deletion-request intake. Deletion requires operator review; requesting deletion does not erase data or cancel billing.
- Public support, privacy/data and service-terms contact pages. Full commercial terms are prepared behind an approval flag. Removed the internal build-progress notice from the workspace.
- Dependency security updates, private response caching rules and basic security headers.

## Release evidence

- TypeScript: passed.
- Production build: passed.
- Full automated suite: 189 passed, 0 failed, 0 skipped.
- npm production dependency audit: 0 reported vulnerabilities after updates. This is a dependency database result, not a penetration-test certification.
- Browser checks: desktop support page, subscription selection/consent, 390-pixel mobile subscription view and customer email attachment submission using isolated fixtures. Production fixture assets are excluded.
- Local SQLite benchmark: 10,000 representative tickets and 12 concurrent scoped reads completed in 379 ms during the full suite. This does not establish production concurrency or an uptime SLA.
- Synthetic recovery restored schema, rows and attachment bytes; integrity, foreign keys, checksums and existing-destination rejection passed.
- Production deployment: PUBLIC release published successfully. First maintenance processed four workspaces; first backup verified 62 tables and 283 rows (no production file objects existed). Both returned HTTP 200. Authenticated health returned status ok with both jobs successful.
- Native schedules are active: maintenance every two minutes, health every five minutes, backup daily at 03:15 UTC. An hourly ChatGPT health watch notifies the owner only when a problem is detected. Alerts are hourly, not immediate paging.

## Owner actions that remain

1. **Stripe business account:** complete identity/payout setup and securely connect it. See BILLING_SETUP.md for exact product, prices, portal, webhooks and acceptance gates. Approve the transition for existing workspaces before enforcing payment. No keys should be sent in chat.
2. **Business/policy details:** provide legal seller identity and approve pricing, refund/cancellation policy, support coverage and retention. Prepared terms and decisions are in LEGAL_REVIEW.md. Regulated-data commitments and vendor agreements require business review.
3. **Domain DNS:** add the three exact records in DOMAIN_SETUP.md. app.quevian.com has been created but is awaiting owner-controlled DNS verification; the existing Sites URL remains working.
4. **Independent backup approval:** approve or change this precise proposal: copy full application database and file backups, including customer data, into a private archive in the existing Supabase project; retain 30 days and permanently delete older backup copies. Automatic approval review rejected that transfer/retention operation without explicit approval. No workaround has been installed. Current R2 backups have no automatic expiry.
5. **Account security and final provider tests:** enable leaked-password protection in Supabase Auth; confirm provider account recovery/MFA and business usage limits. Use owner-controlled accounts for real sign-up/reset/invitation and staff/customer isolation checks, a real attachment round trip, then real Stripe test-mode acceptance. Existing automated checks simulate identities and provider responses; they cannot certify owner account settings.

## Launch scope

Sell the implemented service desk/workspace capabilities at the published price only after billing and policy gates pass. Optional AI, calendar/mailbox OAuth sync, Slack/Teams, accounting/RMM adapters, advanced branching workflows, full ConnectWise migration, compliance certifications and large-scale qualification are not included simply because old planning screens mention them. Core support email uses the now-working forwarding integration. A service owner must actively handle support, incidents and data requests; the application cannot supply staffing.

Operational procedure and backup capacity are in OPERATIONS.md. Historical RELEASE_STATUS.md and PROVIDER_SETUP.md retain older feature notes; this file takes precedence for current launch status.
