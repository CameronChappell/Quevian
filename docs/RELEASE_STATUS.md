# QueuePilot release status

This is a working private service-management application, not a completed public SaaS launch. The original brief is broader than the implemented release. Do not describe provider-dependent or remaining advanced features as complete.

## Available now
- Authenticated, isolated organizations; shared records, built-in and custom operational roles; team invitations and audit history.
- Tickets, boards/statuses, search across records and internal notes, shared saved views, table/compact/Kanban layouts, parent/child tickets, guarded merges, public/internal conversations, attachments, tags/types/subtypes/custom fields and ticket-level time/scheduling.
- Dashboard, configurable widget visibility/order, quick-create, global command/search palette, company profiles and related service history.
- Calendar, hourly dispatch drag/drop and appointment resizing, keyboard-accessible schedule editing, workload counts, time entries/timers and weekly CSV timesheets.
- Continuous or UTC business-hour/holiday SLA deadlines. Existing deadlines remain snapshots; no waiting-state pause rules.
- Projects/tasks/templates/dependencies with cycle and completion guards; assets and downloadable authenticated deep-link QR labels.
- Customer portal, public replies and customer-visible files, explicitly shared assets/projects, internal data exclusion.
- Reports with UTC date/company/board/technician filters, average response/resolution, technician hours, CSV and print/PDF.
- First-match event rules for created/updated/status/priority/closed tickets and customer responses. Reusable reply templates. In-app notification preferences.
- CSV preview/import for companies, contacts, assets, and Viewer invitations, up to 500 records; malformed rows rejected, duplicates skipped.
- Recurring templates with an explicit Run due tickets action, one occurrence per due template, combined missed intervals, atomic deduplication and next-date advancement.
- Agreement terms and rates as records. Recording an agreement does not create invoices or charge money.

- Project financial plans with currency, budget, start date, hourly labor cost estimate, internal assumptions, logged-hour totals, and remaining budget. Amounts are stored in cents; currency is fixed after recording expenses. Financial reads and writes require projects:write.
- Expense register with vendor/category/date, planned/committed/paid/voided states, version checks, audit history, and CSV export. Only committed/paid entries reduce remaining budget; planned amounts are shown separately. No payments or purchase orders are sent.
- Milestones with target dates, owner, acceptance notes and completion. Milestones remain distinct from tasks and internal to staff.
- Company locations with site address, phone, access notes and active/inactive state. Contacts can have a mobile number, preferred contact method, linked company location and internal notes. Same-company links are enforced by database triggers, including when a contact is moved.

- Advanced board settings: default technician, email reference, four custom severity display names and per-severity SLA overrides. Email references do not ingest mail. Explicit unassigned selection overrides the board default.
- Purchasing register with line items, exact cents totals, approval/order/receipt/cancellation transitions, frozen approved drafts, audit and CSV. This records purchasing status; it sends no orders or payments and does not automatically create expenses.
- Delivery templates with role assignments, relative task/milestone dates, prerequisite links and atomic application to a versioned project.
- Company and project document uploads/downloads, with explicit customer visibility. Project documents also require the project to be shared. Uploads are immutable; document deletion/version replacement is not yet available.
- Same-company contact-to-equipment links, protected against invalid contact/asset moves.
- Automation actions can notify a teammate and create a task on an already-linked project. WHEN/IF/THEN summaries show rules. Notes can mention a teammate; project, mention and SLA preferences suppress corresponding notifications.
- Manual SLA/inactivity checks process up to 100 previously unnotified candidates per run: resolution within one hour/overdue or seven days inactive. Repeated checks deduplicate reminders; no background scheduler is implied.

## Remaining-section implementation
- Invoice ledger: editable drafts, issuance locks, unpaid voids, external payment records, overpayment guards, tenant/company/currency validation, audit history and Excel downloads. Issuance sends no email and moves no money. Project profitability compares issued invoice totals with estimated labor and committed/paid expenses; currencies are separate.
- Saved report definitions: rolling periods, company/board/technician filters and weekday capacity. Utilization, category counts, and real .xlsx exports supplement the existing reports. Exports were opened by an independent workbook reader; user strings remain text, never executable formulas.
- Teams: named groups with transactional member replacement and role-independent membership. Workspace setup links to each configuration step and reports actual saved-record counts.
- API access: read-only keys with hashed secrets, scopes, expiry and revocation. The key owner must also be signed in to the private Site. A cursor-based audit summary feed supports authenticated consumers. No public service account or outbound webhook sender is implied.
- Integrations: persistent account/setup notes with explicit disconnected status. OpenAI drafting is implemented with an organization allowlist, secret runtime key, configurable model, timeout and basic request throttle. It is disabled until configured. Ticket/company/project summaries, triage suggestions and response rewriting are review-only. Customer-update drafts omit internal notes from their source.
- Ticket assistance: recorded-fact brief and same-organization keyword matching against resolved tickets; no provider is needed for this feature.
- Timed automation triggers: SLA approaching, overdue, and inactive checks support existing actions through an explicit Run timed rules command, with per-deadline deduplication. Follow-up ticket actions are atomic and do not recursively trigger creation rules; new deadlines use current board SLA settings.

## Not connected / cannot be activated without service setup
- Microsoft/Google email ingestion, reply delivery, external calendar synchronization.
- Teams/Slack delivery, accounting/billing/RMM and other external adapters. AI requests have a tested adapter but no configured production provider.
- Unattended schedules, unattended SLA/inactivity rules, and scheduled email reports: need a supported job scheduler/outbox and real delivery destinations.
- Public multi-customer SaaS distribution: current Site remains owner-private. In-app staff invitations/customer grants do not grant access to the private Site.

## Advanced brief requirements not yet implemented
- External procurement integrations; full tax, credit-note, refund and accounting-ledger workflows.
- Optional branching workflow graphs and provider-dependent send-email/Teams/Slack actions.
- Real-provider AI acceptance and advanced semantic retrieval. Contextual drafting now has an optional provider adapter; keyword history matching works locally.
- Scheduled email report delivery and expanded accounting analytics.
- Granular record-level internal read restrictions, outbound webhook delivery/service authentication, and public billing/security administration.
- Full ConnectWise migration, validated 100,000-ticket scale, and public multi-account release qualification.

## Validation and practical limits
- 48 automated database/API tests pass against real generated SQLite schema. Tests exercise auth, tenant isolation, version conflicts, timers, schedules, customer/file privacy, custom roles, CSV import, merges, recurring deduplication, holiday deadlines, project dependencies, and report filters.
- TypeScript and production build pass. No browser QA requested or performed. Live multi-user and external-provider acceptance tests remain unperformed.
- Dispatch uses local time and one-hour drop increments. Calendar editing supports precise start/end values. Scheduling does not silently change the ticket's primary assignee.
- Kanban shows the current filtered page, not an unbounded board. Directory/global search and dashboard still use bounded results rather than a proven enterprise search index.
- Customer-visible source messages and files move to the destination during a same-company merge. Source audit and source asset/project links remain available for history. Merging cannot be undone through the UI.
- Custom roles replace built-in operational capabilities; all internal members retain organization-wide internal read access. Owner/Administrator management powers cannot be assigned to custom roles.

## Where to find this release’s additions
Open a project to use Milestones or Budget & expenses. Click a company name in Companies, then Locations. Click a contact name in Contacts to view or edit communication preferences, location, and service history. Financial estimates use all time on currently linked tickets and a single project labor cost rate; they are not invoiced profit or a historical cost ledger.

Current additions: Workspace tools → Advanced boards / Delivery templates; project → Purchasing / Project files; company → Documents; contact → equipment; Automations → Run SLA / inactivity checks. New regression coverage verifies draft freezing, template atomicity, company/project document privacy, customer-response effects and reminder deduplication.

Open Workspace tools for Teams, Workspace setup, Invoices & profitability, and API & security. Reports contains Saved reports, utilization/category details, and Excel export. Ticket → Brief & history contains recorded briefs and optional AI drafts. Company → Summary and project → Status draft use the same optional provider. See PROVIDER_SETUP.md for the activation and launch boundary.
