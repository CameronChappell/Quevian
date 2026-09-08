# Provider setup and launch boundary

QueuePilot remains a private Site. Adding an organization member or customer grant does not grant access to the Site itself. Do not change the Site audience without the owner requesting it.

## Optional AI

The adapter uses OpenAI Responses, with no provider-side stored response and no tools. Official API reference used: https://developers.openai.com/api/docs/quickstart

Configure these hosted runtime values, then deploy a saved version:
- QUEUEPILOT_OPENAI_KEY: provider key, marked secret.
- QUEUEPILOT_AI_MODEL: an available Responses-compatible model ID approved for this deployment.
- QUEUEPILOT_AI_ORGANIZATIONS: comma-separated exact organization IDs allowed to use this account.

No organization is enabled by default. Generated text is returned as a reviewable draft, never sent or applied automatically. Requests are bounded to 30 seconds, 30,000 source characters and 1,200 output tokens, with one request per user/organization per ten-second slot. This is a basic throttle, not a complete billing quota system. A mocked provider validates the protocol; no real provider acceptance test or key is present. Customer-update generation omits internal notes from its source. Other internal summary actions may include internal data, as stated in the UI.

## Other services

The Integrations screen records account and rollout notes only. Do not store secrets there. Microsoft/Google mailbox ingestion, calendar synchronization, Slack/Teams delivery, QuickBooks/Stripe/RMM and documentation adapters are not implemented or connected. They need provider-specific OAuth/service authentication, credentials, webhook verification, retries/outbox delivery and acceptance tests. An installed ChatGPT connector does not automatically provide runtime authentication to the hosted Site.

The read-only API requires both the key owner's signed-in Site session and a hashed, scoped, unrevoked, unexpired key. It cannot be used as a public or unattended service authentication mechanism. Endpoints are GET /api/integration/ORG/tickets and GET /api/integration/ORG/events. Event cursors advance by the returned cursor; consumers should persist their own cursor. Events expose audit summaries, not full before/after payloads. There is no outbound webhook sender.

## Remaining launch work

The original brief is not fully completed: external adapters/delivery, unattended schedules/email reports, granular per-record internal read restrictions, advanced branching workflows and additional actions, invoice tax/credit/refund accounting, document version replacement/deletion, full ConnectWise migration, and real multi-user/browser/security/100,000-ticket scale qualification remain. Teams group people and do not restrict record access. The current private release must not be advertised as a public, paid, fully qualified ConnectWise replacement.
