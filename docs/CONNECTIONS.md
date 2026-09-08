# QueuePilot provider connections — remaining prerequisites

The core app does not send external email, synchronize external calendars, or call a model provider. Do not mark these configured until authorized accounts and credentials exist and an actual provider request succeeds.

## Email/calendar adapters
Use organization-scoped provider account records, encrypted refresh tokens or platform-managed secrets, explicit supported scopes, revocable connections, a callback path verified against the deployment URL, and independent provider adapters. Microsoft and Google app registrations / credentials are not present. Provider login must use the supported hosting platform auth path; do not improvise an app-owned public auth stack without confirming support.

Email intake needs idempotent message-ID indexing, tenant-specific mailbox mapping, safe threading by provider IDs, reply deduplication, attachment scanning/limits, retry/backoff and webhook validation. Outbound replies need an outbox with delivery status separate from the portal conversation record. Calendar sync needs provider event IDs, change tokens, time zones, conflict handling, cancellation propagation and loop prevention. None of these can be truthfully validated against a provider without its connected account.

## AI adapter
Add a server-only provider connection and tenant-level enable/disable settings. Implement ticket summarization behind explicit user actions first, with minimal necessary context and editable outputs. Preserve notes' internal/customer visibility. Do not equate generated suggestions with completed actions or automatically send suggested replies.

## Notifications / scheduled work
Internal notifications are implemented. External Teams/Slack delivery requires real destination connections. Background SLA notifications and scheduled automations require a supported scheduler, durable job queue, idempotent execution and retry logs; the current event rules only run on actual ticket mutations.
