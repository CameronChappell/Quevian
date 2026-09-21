# Activate subscriptions

Implementation is complete, but no Stripe business account or live payment credentials are connected. Billing and paid-access enforcement remain disabled. Account creation never authorizes payment.

## Owner account actions

1. Create or open the business Stripe account and complete business identity, bank payouts and verification. Decide the legal seller name and tax registrations with the business adviser.
2. Supply the reviewed service terms, privacy contact and refund/cancellation policy described in LEGAL_REVIEW.md. Configure the public business information in Stripe, including the accepted terms URL.
3. Connect the account for setup or enter credentials directly into the Site runtime secret settings. Do not send keys in chat or commit them.

## Exact provider configuration

- Product: Quevian Workspace, per staff seat, licensed usage, USD.
- Monthly price: 1900 cents per month, interval_count 1.
- Annual price: 18000 cents per year, interval_count 1.
- Customer-only portal accounts are not billed as staff seats. Active staff and unexpired invitations reserve capacity. Suspend access or revoke invitations before reducing below usage.
- Customer portal: payment method update, invoice history and cancellation at period end. Disable portal quantity/plan updates; the application enforces seat counts. Save the portal configuration ID.
- Webhook: https://queuepilot.boomacooks.chatgpt.site/api/webhooks/stripe (switch to custom origin only after domain verification).
- Events: checkout.session.completed; checkout.session.async_payment_succeeded; checkout.session.async_payment_failed; customer.subscription.created; customer.subscription.updated; customer.subscription.deleted; invoice.paid; invoice.payment_failed. The handler retrieves canonical subscription state and verifies the raw-body signature.
- Configure the exact runtime variables in .env.example: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET as secrets; price IDs and STRIPE_PORTAL_CONFIGURATION_ID as values. Enable STRIPE_AUTOMATIC_TAX only after the Stripe account's tax setup and obligations have been reviewed.

## Activation gate

Use a separate isolated test workspace and Stripe test mode first. Verify: successful checkout creates one subscription; abandoned/repeated checkout creates no duplicate; card decline grants no paid access; signed webhook replay is idempotent; seat increase with failed payment remains pending; seat reduction respects active staff and invitations; cancellation retains access until paid period end; renewal failure removes mutation access and leaves records readable; customer portal cannot bypass seat checks. Tests must use the real provider's test facilities, not a real customer charge.

Automated tests currently use a simulated Stripe provider. They do not prove account configuration, taxation, live settlement, refunds or provider delivery.

After those tests and owner policy approval, configure matching LIVE keys/prices/webhook, set QUEVIAN_LEGAL_APPROVED=true and QUEVIAN_BILLING_ENABLED=true, deploy, and perform an owner-authorized live purchase/cancellation check. Set QUEVIAN_BILLING_REQUIRED=true only after the owner chooses how existing workspaces transition to paid access. No charges or account-verification actions were performed by this launch pass.

Provider references: https://docs.stripe.com/api/checkout/sessions/create and https://docs.stripe.com/billing/subscriptions/webhooks
