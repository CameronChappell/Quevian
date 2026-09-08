# Launch test report — September 8, 2026

Result: **100 passed, 0 failed, 0 skipped**.

Run with `npm run test:launch` after installing the project's locked dependencies. Node 22.13+ is required for the SQLite test harness.

## Scope and evidence

| Suite | Tests | Coverage |
|---|---:|---|
| workspace.test.mjs | 51 | Existing database/API regressions: tenant isolation, tickets, boards, files, portal visibility, role enforcement, scheduling, reports, and automations |
| email-auth.test.mjs | 11 | Auth request validation, verification requirements, safe redirects, resets, throttling, invitation delivery responses, and a signup-to-staff-onboarding journey |
| launch-access.test.mjs | 38 | 8 board validations/lifecycle checks, 8 staff membership checks, 14 company portal checks, 8 tenant and reference isolation checks |

39 new cases were added; 61 existing cases were rerun. No application defects were exposed by these scenarios, so no production code changes were made.

Tests execute real application services, selected HTTP route handlers, and all SQL migrations against disposable SQLite databases with foreign keys enabled. Each scenario uses synthetic identities and fresh data. Supabase Auth, Resend responses, Cloudflare bindings, request identity headers, and attachment storage are simulated where needed. The signup journey advances the simulated verified identity explicitly after a successful confirmation response; it does not verify an actual mailbox or provider token exchange.

Organization boundaries and customer-company boundaries are distinct: staff memberships may authorize organization-wide access; customer portal grants are limited to their authorized companies. These tests do not establish per-company restrictions for staff roles that currently have organization-wide access.

## Remaining acceptance work

- Real Supabase signup, email receipt, verification links, cookie/session persistence and expiry, password recovery, and logout across separate browsers.
- Real invitation email receipt and opening the link as a different account.
- Browser UI interactions, mobile layouts, accessibility, and concurrent-user testing.
- Production D1/R2 behavior, load testing, backups/restoration, monitoring, and failure recovery.

This passing suite is regression evidence, not a declaration that the product is launch-ready. No live records were created and no external emails were sent by this run.

## Executed cases

1. auth actions fail closed when disabled and reject cross-site mutations
2. signup validates passwords before contacting the provider and preserves safe destinations
3. login rejects unverified and anonymous identities and sanitizes redirects
4. password reset requires verified provider identity; invalid confirmation is rejected
5. recovery replies are generic and email-specific throttles are enforced
6. matching email alone cannot take over an existing workspace; explicit dual-account linking preserves its identity
7. safe return paths permit invitations but block external URLs and reserved auth routes
8. reissued invitations invalidate old links and delivery fails honestly without a sender
9. mail retries are throttled and provider acceptance is not sent twice
10. current and legacy request headers pass while cross-site and unmarked requests fail
11. new verified signup proceeds through login, organization setup, a board, a ticket and accepted staff invitation
12. board rejects duplicate names ignoring case
13. board rejects blank status names
14. board rejects an entirely closed workflow
15. board rejects a workflow without a closed state
16. board rejects a single status
17. board rejects more than thirty statuses
18. reordered custom open status becomes the default for subsequent tickets
19. renaming an occupied status is rejected without changing its ticket
20. accepting an invitation twice cannot duplicate membership
21. pending invitation does not grant ticket visibility
22. engineer cannot invite additional staff
23. manager cannot invite an administrator
24. owner can invite an administrator with the intended role
25. existing members cannot receive another pending invitation
26. demotion immediately prevents ticket writes with an existing service instance
27. another organization cannot revoke a valid staff invitation
28. portal ticket list excludes another company
29. portal rejects direct lookup of another company ticket
30. portal rejects switching to an ungranted company
31. portal rejects public replies on another company ticket
32. portal rejects a forged company field during ticket creation
33. portal-created tickets belong to the granted company
34. portal customers cannot write staff-only notes
35. portal detail excludes internal notes and staff audit
36. portal displays staff public replies and customer replies
37. portal grant revocation immediately blocks reads and replies
38. portal grants cannot target another organization company
39. portal cannot enumerate staff workspace data
40. portal account lists only grants matching its email
41. visible projects from another company stay out of the portal
42. cross-tenant ticket update leaves original intact
43. cross-tenant board editing is forbidden
44. cross-tenant company editing is forbidden
45. contact from another company in the same organization is rejected
46. cross-tenant assignee cannot be added by ticket update
47. cross-tenant portal grant does not authorize a matching ticket number
48. organization account list does not reveal other owners organizations
49. forged role input cannot create an owner invitation
50. missing stable identity cannot create a service
51. organization membership gates all resource entrypoints
52. company, contact, board, and assignee references must share a tenant
53. ticket lifecycle persists assignments, notes, and actor-attributed audit
54. stale writes and notes do not overwrite records or append audit
55. same ticket number in two organizations never shares notes or details
56. invitations require matching identity, acceptance, and enforce role limits
57. revoked and expired invitations do not grant membership
58. used board statuses retain their meaning; directory writes use versions
59. sample option seeds 54 tickets, directory records, pagination, and filters
60. unknown fields, oversized text, and invalid status are rejected
61. database state survives process-style database reconnection
62. HTTP routes reject anonymous identity, cross-site mutations and untrusted tenant fields
63. email-only dispatcher identity can onboard, reload and access only its own workspace
64. calendar atomically rejects overlaps, accepts adjacent work, and supports cancellation
65. time entries reject overlaps and enforce ownership; a stopped timer saves only once
66. SLA snapshots require a public staff response and record resolution time
67. projects, tasks, and assets link only to the ticket company and preserve versions
68. customer portal never returns internal notes, private equipment, audit or another company
69. event rules execute once, use first match, support dry runs, and notify assignees
70. reports aggregate actual ticket and time data and isolate company filters
71. attachment uploads and downloads enforce customer visibility and tenant access
72. custom roles replace operational permissions and cannot elevate administration
73. CSV parser handles quoted commas and newlines; imports preview, reject errors, skip duplicates and isolate tenants
74. child relations prevent cycles and tenant/company changes; merges preserve source audit and consolidate notes
75. recurring runs are idempotent, advance overdue schedules, and apply ticket automation
76. business SLA skips weekends and holidays while preserving exact working minutes
77. project templates are transactional and reject stale application; metadata respects tenant membership
78. task dependencies block cycles and completion until prerequisites are done
79. report filters and notification preferences are applied to persisted data
80. project financial plan uses cents, linked time and expense states; currency and versions cannot silently change
81. milestones enforce project and owner tenant boundaries and prevent moving between projects
82. locations and contact profiles enforce same-company links, safe contact moves and directory permissions
83. board defaults distinguish omitted assignment and snapshot board SLA overrides
84. purchases preserve exact totals, enforce lifecycle and freeze approved drafts
85. delivery templates atomically assign roles, dates, prerequisites and milestones
86. contact equipment links reject different companies and protect contact moves
87. automation creates linked tasks once, mentions respect preferences and scans deduplicate
88. company documents hide internal and private-project files from customers
89. customer-response rules apply guarded ticket and project effects
90. invoice ledger enforces issue locks, payment limits, currency and tenant isolation
91. teams replace membership atomically and reject foreign users and stale edits
92. read-only API keys are hashed, scope-bound, identity-bound and revocable
93. report definitions validate tenant filters and analytics use filtered logged hours
94. timed rules apply once per deadline without recursively triggering update rules
95. ticket briefs and resolved-history matching never cross organization boundaries
96. AI is disabled without organization setup and returns review-only provider drafts
97. follow-up automation creates one open ticket with fresh SLA and no creation-rule recursion
98. ticket search handles formatted IDs, unordered words, contacts and combined filters without leaking tenants
99. new service boards accept tickets with their own initial status and board filter
100. exact status filters include custom and closed states while respecting board scope
