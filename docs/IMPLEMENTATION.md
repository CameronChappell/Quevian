# Current release

See [RELEASE_STATUS.md](RELEASE_STATUS.md) for the authoritative implemented scope, prerequisites, and remaining work. Sections below retain the phased implementation history.

# QueuePilot implementation status

## Completed section 1 — ticket workspace
Neutral blue-accented light/dark design, supplied logo, responsive navigation, searchable queue, ticket creation and detail panel. The original local demo remains in the user's browser under queuepilot.section1.v1; the shared app does not silently import it.

## Completed section 2 — identity, organizations, shared records
- Dispatch-owned ChatGPT sign-in for the private Site. Forwarded user ID is used when supplied. The current private dispatcher supplies authenticated email/name only, so a namespaced SHA-256 key of normalized authenticated email is used when ID is absent. Email-only identity changes require explicit account migration; client-submitted identities are never accepted.
- Organization onboarding and switching. New organizations start empty, with an explicit optional sample-record choice (10 companies, 25 contacts, 54 tickets).
- Cloudflare D1 schema and packaged Drizzle migration. Every resource read/mutation checks authenticated identity, organization membership and required capability server-side.
- Composite foreign keys enforce same-organization company/contact/board/assignee relationships. A contact also belongs to the ticket's selected company.
- API validation, bounded request bodies, same-origin/custom-header mutation checks, private no-store responses, version conflict detection, transactional audit writes.
- Server-side ticket search/filtering/sorting and 12-row pagination; indexed queue/assignee/board queries. Ticket notes and assignment changes persist in shared storage. Notes remain internal.
- Ticket deep links: /?org=<organization>&ticket=<number>. Note drafts are stored per organization/user/ticket in this browser until submitted.

## Completed section 3 — directory, boards, team administration
- Create/view/edit companies and contacts; view a company's tickets.
- Create/edit boards and custom statuses, including open/closed classification. Names/meaning of in-use statuses are protected; unused statuses can be edited or removed.
- Owner, Administrator, Manager, Engineer and Viewer roles with server-enforced capability checks. Viewer means internal organization viewer, not customer portal access.
- Pending email-matched invitations, explicit acceptance, expiry, revocation and role changes. No invitation email is sent. Private Site access remains a separate prerequisite; application invitations do not modify sharing.
- Organization settings, account display, role permission matrix and paginated audit history.

## Architecture and routes
- UI: components/queuepilot/{workspace,tickets,directory,settings,common}.tsx.
- Domain types and fixed permission policy: lib/domain.ts.
- Injectable D1 service: lib/server/service.ts. Runtime identity/HTTP boundary: lib/server/http.ts.
- Root page requires ChatGPT sign-in. /api/account handles account/onboarding/invitation acceptance. /api/workspace/[organization]/... handles tenant-scoped resources.
- Database: organizations, users, memberships, companies, contacts, boards, tickets, ticket_notes, invitations, audit_events. Ticket numbers are unique per organization. UTC storage timestamps. Ticket/directory versions prevent stale writes.
- Existing platform sign-in/session handling is reused. No password database, app-owned public sign-up, or external OAuth flow has been introduced.

## Validation
22 automated database/API tests use the actual generated SQL with foreign keys enabled and the production service/route implementations. Coverage: missing identity, cross-tenant reads and mutations, composite references, ticket lifecycle, note attribution, stale updates/notes, tenant-local ticket numbers, invitation acceptance/expiry/revocation, role permissions, board status integrity, directory versions, sample records, pagination/search, persistence after reconnection, request size/CSRF/unknown-field rejection.
Command: node --test tests/workspace.test.mjs.
TypeScript noEmit and the Sites production build pass. No browser QA was requested or performed. Live multi-account access remains to be exercised with user-granted Site access.

## Current deployment scope
This is the private phased QueuePilot build. Its complete set of implemented core workflows and provider-dependent limits is described in the sections below. Public SaaS rollout, account billing and the advanced PSA scope remain separate work.

## Sign-in compatibility fix
Production /api/account requests returned 401 because the dispatcher supplied authenticated email/name without a user-ID header. The identity resolver now accepts that authenticated header shape, and a regression test covers onboarding/reload/tenant isolation with email-only identity. Missing authentication is still rejected.

## Completed section 4 — operations
- Dispatch shows unassigned tickets and per-member open load / upcoming seven-day scheduled hours; inline assignment uses version checks.
- Day, week, month and member-filtered calendar. UTC timestamps, local-time presentation, meetings/PTO/company events, cancellation, and atomic overlap rejection using database triggers.
- Manual billable/non-billable time, persistent per-user timer, stop/save/discard, ownership checks, one running timer per organization/user, overlap rejection and audit logging. Time rounds up to minutes and each entry is capped at 24 hours.
- Configurable per-priority 24/7 response/resolution policies. Deadlines are snapshotted on new tickets or priority changes. Internal notes do not satisfy response targets; public staff replies do. Closed/reopened tickets record/clear resolution timestamps.
- Personal notifications for ticket assignment, schedule changes and public replies; mark-read is scoped to the current user.

## Completed section 5 — delivery, equipment, customer access, reports
- Projects with company, owner, status, deadline, estimated hours, per-task owners/deadlines/completion and progress. Ticket linking enforces the same company.
- Asset registry with equipment type, manufacturer/model/serial, IP/MAC, location, purchase/warranty dates, status, private notes and explicit customer visibility.
- Separate /portal entrypoint and email-matched per-company customer grants. Customers can create and view their company's requests, read/post public replies, upload/download customer-visible files and view explicitly shared projects/equipment. No staff membership is implied; internal notes/audit/asset IP/MAC/private projects are excluded server-side.
- Staff ticket tabs for customer conversation, internal notes, audit, related project/asset and attachments. Cloudflare R2 stores bounded 5 MB attachments; D1 stores access-controlled metadata. Downloads are attachments with nosniff and no-store, never inline execution. Internal visibility is the default for staff uploads.
- UTC date/company-filtered ticket and time reporting; resolution SLA results, company/status volume, technician/billable time, CSV export (formula-leading values escaped) and printable report for Save as PDF.

## Completed internal portion of section 6 — event automations
- Up to 50 configurable rules, enabled/disabled, in creation order. Events: ticket created, status changed, priority changed. Conditions: priority, board, status. Actions: assign/unassign member, change priority, move board/status, add internal note.
- First matching enabled rule runs once per event; no recursive rule chain. Changes and rule attribution are part of the ticket mutation transaction. Board/status references are validated; in-use automation statuses cannot be removed accidentally.
- Read-only condition test against an actual ticket. Testing does not modify the ticket or trigger a rule.

## Outstanding provider-dependent work and advanced scope
Microsoft/Google email intake and calendar synchronization, Teams/Slack delivery, and contextual AI are explicitly not connected. The Connections screen describes the provider setup required and makes no fake connection or AI claims. Provider app registrations/permissions and secure server-side credentials are required before these can be activated; this build sends no email or external AI requests.

Advanced PSA scope still outside these core sections: custom role builder, holiday/business-hours SLA calendars and pause rules, recurring tickets, merges/child tickets, drag-and-drop dispatch, billing/accounting/RMM integrations, advanced analytics, unattended scheduled automation, and bulk ConnectWise migration. No placeholders pretend these work.

## Latest validation
22 database/API tests pass against the generated schema and production service/route code, including the original live email-only dispatcher regression. New coverage: schedule overlap/cancellation, timer single-stop/time ownership, response-vs-internal-note SLA semantics, same-company links, customer data exclusions, first-match nonrecursive automation, report totals, attachment visibility/download behavior. R2 is modeled in the file-access tests; no live customer-upload fixture is injected. TypeScript and production build pass. Browser QA has not been performed.

## New source ownership
Operations service: lib/server/operations.ts. Rule planning / SLA snapshots: lib/server/automation.ts. File access and bounded uploads: lib/server/files.ts. Interfaces: work.tsx, resources.tsx, management.tsx, portal.tsx, ticket-extras.tsx, files.tsx, module-common.tsx. Schema migration 0001 adds operations/delivery/portal/automation tables and overlap triggers without deleting existing data. Logical R2 binding: BUCKET.

## Expanded internal release
Custom roles, relationship/merge transactions, imports, recurring ticket generation, business-hour SLA calculations, dashboard/preferences, global search/commands, quick-create, company profiles, shared board views, ticket metadata/work controls, reply/project templates, task dependencies, asset QR labels, and expanded report filters are implemented. Source: advanced.ts service and advanced/board-views/company-profile/dispatch-timeline/quick-create/resource-extras/ticket-advanced UI modules. Migrations 0002 and 0003 add eight tables and integrity/preference triggers; existing data is retained. Runtime now instantiates Advanced, extending Operations and Service.

30 targeted tests pass. Core sign-in and tenant regression tests remain included. The original brief's public-SaaS and advanced scope is not claimed complete; see RELEASE_STATUS.md.

## Delivery and customer detail release
Runtime service now instantiates Delivery, extending Advanced. Five new tables store project financial plans, expenses, milestones, company locations and contact profiles. Migration 0004 adds same-company and currency integrity triggers using the hosted-compatible SELECT RAISE WHERE form. Financial totals combine cents-based expenses and time logged on linked tickets; no payment or accounting-provider behavior is implied. Financial access requires projects:write. Directory profile writes require directory:write. API and UI are wired through the existing authenticated tenant routes; no new auth path.

33 database/API tests pass. New cases cover monetary precision and currency changes, planned/voided expense totals, milestone ownership/project boundaries, contact relocation constraints, and denied financial access. Browser QA remains unrequested and unperformed.

## Four-section expansion — 2026-09-07
Advanced boards, purchasing and delivery templates, company/project documents and contact equipment, and automation/notification extensions are implemented. Migration 0005 adds six tables (42 total) and company/visibility/preference guards. Forty database/API tests and TypeScript pass. External mail, purchasing delivery and unattended scheduling remain unconnected; see RELEASE_STATUS.md for precise limits.

## Remaining-section expansion — 2026-09-07
Added Completion service and contextual AI adapter; invoice/payment ledger, currency/company guards, teams, scoped read API keys, event feed, report definitions, utilization/category analysis, XLSX writer, recorded ticket briefs, provider setup registry and onboarding. Timed rules and follow-up ticket actions share guarded transactional effects. Migration 0006 adds five tables (47 total). Forty-eight database/API tests pass including mocked AI gating/protocol and nonrecursive follow-ups; independent Excel round-trip passed. External provider activation, delivery services and launch qualification remain explicitly outside the completed private release.
