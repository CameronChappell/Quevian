# Support email activation and acceptance

Implemented: incoming Resend email webhooks, per-company/board inboxes, token-address reply matching, explicit outbound public replies, provider idempotency, signed delivery events, visible retry/bounce/delivery states. Existing portal-only replies remain available. Internal notes and files are never included in outbound emails.

## Required operator setup

Keep the existing RESEND_API_KEY and QUEVIAN_EMAIL_FROM. The API key must have permission to retrieve received emails as well as send messages. Receiving is not enabled by verifying a sending domain alone.

1. In Resend, choose Receiving Emails → Inbound address. Use its assigned receiving domain, or configure a dedicated receiving subdomain such as inbound.quevian.com. If using a custom subdomain, add exactly the MX records Resend specifies. Do not replace the root domain's mailbox MX records.
2. Add this webhook endpoint in Resend:
   https://queuepilot.boomacooks.chatgpt.site/api/webhooks/resend
3. Subscribe to email.received, email.delivered, email.delivery_delayed, email.bounced, email.complained, and email.failed.
4. Set secret RESEND_WEBHOOK_SECRET to that endpoint's whsec_ signing secret in the Site runtime. Set QUEVIAN_INBOUND_DOMAIN to the receiving domain only (no @ or https://). Never commit secrets.
5. Republish to activate runtime configuration. In Quevian → Connections → Support email, create an inbox for the intended company and service board. The app generates a unique address; no organization can claim another organization's inbox. Configure forwarding from a friendly support mailbox if desired.

## Live acceptance (not yet completed)

Use a dedicated test company and your own external mailbox. Do not test by sending messages to real customers.

- Send a uniquely titled plain-text email to the generated inbox. Confirm one ticket on the selected board and company.
- Replay the same webhook in Resend. Confirm no duplicate ticket.
- Open Customer conversation, check Also send by email, and send a public reply. Confirm both arrival in your mailbox and Delivered status in Quevian. Accepted only means Resend accepted the API request; Delivered means the recipient mail server accepted it, not that it was read or placed in the inbox.
- Reply to that email. Confirm the response appears on the same ticket without a new ticket. Subject numbers alone do not select a ticket.
- From a different sender, reply to that token address. Confirm it is ignored. Test a second organization and confirm it cannot inspect or retry the first organization's deliveries.
- Add an internal note and internal attachment; confirm neither appears in the email.
- Use Resend's test facilities for bounce/delayed events. Confirm the UI reports them accurately. A provider timeout must leave one saved reply with a Retry saved email action.

## Deliberate limits

- Incoming attachments remain in Resend; ticket text explicitly discloses this. Automatic attachment import and outbound attachments are not implemented.
- Delivery is attempted during the explicit Send reply action. Failures and abandoned attempts require the visible retry action; unattended background retries are separate work. The same payload/idempotency key is used for retries. After 23 hours, uncertain delivery requires operator review instead of risking a duplicate beyond Resend's idempotency window.
- Inboxes currently route to a fixed company and board. Email alone never creates membership or grants portal access.
- Incoming sender addresses are email identities, not authenticated portal identities. No private ticket content is returned to an incoming sender. Only staff-triggered replies are sent to the original requester.
- Unknown, paused, automatic, or ambiguous inbox recipients are ignored. Resend retains the original email for operator inspection.
- Existing email threads are blocked if the ticket is moved to a different company. Merged tickets reject new replies; operators must use the destination ticket.

Documentation: https://resend.com/docs/dashboard/receiving/introduction
https://resend.com/docs/dashboard/receiving/get-email-content
https://resend.com/docs/dashboard/receiving/reply-to-emails
https://resend.com/docs/webhooks/verify-webhooks-requests
https://docs.svix.com/receiving/verifying-payloads/how-manual
