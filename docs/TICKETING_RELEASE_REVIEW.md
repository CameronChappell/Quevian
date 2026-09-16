# Ticketing release review — 2026-09-16

## Result and scope

The ticketing audit found and repaired reproducible workflow and access-control defects. This is a tested hardening release, not a claim that the entire product is defect-free or ready for an unrestricted paid launch.

Reviewed ticket creation, filters and saved views, board transitions, concurrent edits, internal notes, public conversations, company isolation, portal grants, file access, related records, email threading, and merged-ticket behavior. The existing suites also cover invitations, scheduling, time entries, SLAs, automations, projects, billing, and API scopes.

## Repairs

| Area | Corrected behavior |
| --- | --- |
| Filters | Changing layouts preserves status. Saved views store status and remain compatible with older records. Invalid or removed filter references fall back safely. |
| New tickets | A filtered company and board become the creation defaults. Form fields are locked while saving. |
| Navigation | Quick-create and search can open a ticket while already on the ticket workspace. |
| Kanban | A card can only move to a status belonging to its board. Merged tickets cannot be dragged. A status menu supports keyboard and touch use. |
| Loading | Previous records are hidden as soon as the requested URL or ticket filters change. An aborted, late response cannot overwrite the current record. Failed access refreshes clear stale data. |
| Company privacy | Tickets with public messages, customer-visible files, or email threads cannot be transferred to another company. Unused tickets can still be corrected. |
| Concurrent access | Portal replies validate company and grant again at commit. Uploads use the ticket version, company, merge state, and current grant; failed commits remove the new object. Downloads recheck access after object retrieval. |
| Related records | Merged tickets reject changes to project/equipment links. Link updates participate in ticket version checks, preventing a concurrent company change from leaving mismatched links. |
| Merged conversations | Customers are directed to the destination request. Incoming email to the original address follows the same-company destination, preserves the original sender restriction, and remains duplicate-safe. |
| Mobile | Saved-view controls wrap within the toolbar instead of clipping the action button. |
| Regression checks | The rendered-page test uses the application's Cloudflare binding adapter and verifies production metadata and exclusion of development fixtures. GitHub runs TypeScript, the production build, and all tests on pushes and pull requests. |

## Verification

- `npx tsc --noEmit`.
- Production build using the Sites build helper.
- `node --test tests/*.test.mjs`: 159 tests passed, 0 failed, 0 skipped in the final local run.
- Thirteen additional service/database regression scenarios, two merged-email scenarios, and three ticket-view tests. Race tests deliberately change company or revoke access between validation and commit; they use real application services and SQL migrations with isolated SQLite/D1 fixtures.
- Desktop browser checks with the actual React components and explicitly simulated API responses: saved-view round trip; board/status scope; ticket company/board defaults; input locking; new-ticket detail opening; quick-open without remounting; late-response isolation; merged portal destination navigation.
- A 390px iframe provided a real mobile layout viewport for toolbar inspection. This is not testing on a physical phone.
- Browser fixtures do not authenticate to production, deliver email, or access real customer data. They are generated separately by `node tests/support/build-browser-fixture.mjs` and served only during local QA. Their generated directory is ignored by git, and production builds fail while it exists. Remove `public/__audit__` after QA.

## Outstanding launch gates

1. **Activate and prove support email.** The inspected runtime has the sending key, sender, and Supabase configuration, but lacks `QUEVIAN_INBOUND_DOMAIN` and `RESEND_WEBHOOK_SECRET`. Follow `docs/SUPPORT_EMAIL.md`, then demonstrate a real external email → ticket → delivered staff reply → customer reply round trip. Provider-mocked tests do not establish live delivery.
2. **Background operation.** Timed SLA checks, recurring work, reminders, and delivery retries still need an unattended scheduler with retries and failure alerts. Current manual actions are not a production job runner.
3. **Recovery and monitoring.** Configure backup retention and alerts; perform and record a restore of both database records and file objects in a separate environment. Code inspection cannot prove that production recovery works.
4. **Real-account acceptance.** Run a controlled pilot with distinct staff/customer accounts and two organizations, including revoked access, password recovery, invitations, file downloads, and simultaneous edits. This audit did not create production accounts or send messages to customers.
5. **Capacity.** Measure representative data volumes and concurrent users against the hosted database and worker, including search and uploads. Local test timings are not production load-test results.
6. **Launch operations.** Confirm the intended custom domain and all auth redirect URLs, support ownership, customer data export/deletion/retention procedures, and the commercial launch requirements. Subscription billing remains separate from the customer invoice ledger.

Incoming email attachments still remain with the mail provider and are explicitly disclosed in the ticket text; importing them and sending outbound attachments are not implemented. External AI, calendar, and accounting integrations can remain deferred if they are not promised for the pilot.
