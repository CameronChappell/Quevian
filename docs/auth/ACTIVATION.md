# Quevian independent accounts: activation handoff

As of 2026-09-22, the owner requested email/password-only sign-in. ChatGPT sign-in and header fallback are removed. Existing auth_links mappings are retained for already-linked verified accounts; matching email alone never grants ownership. Sender setup and real-account acceptance checks remain necessary.

## Confirmed configuration

- Supabase organization: Quevian.
- Project: psldmriucdsskksanlyy (us-east-2), active.
- Email provider and signups enabled; email auto-confirm is off (verified through public Auth settings).
- App origin: https://queuepilot.boomacooks.chatgpt.site
- SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, QUEVIAN_SITE_URL and a sending-only RESEND_API_KEY stored through Sites runtime settings. No provider secrets committed.
- Resend key is sending-only. Domain-list inspection correctly returns restricted_api_key; this is not evidence of a bad sending key.
- Sender domain/address is not yet supplied or verified. QUEVIAN_EMAIL_FROM is unset.
- QUEVIAN_EMAIL_AUTH_ENABLED remains unset/false; the saved code is not an activated public signup service.
- Supabase connector does not expose Auth configuration updates or SMTP settings. Those settings must be applied via the Supabase dashboard or a separately authorized management connection. Do not modify auth configuration through SQL or retrieve privileged keys from database internals.

## Required provider settings

In https://supabase.com/dashboard/project/psldmriucdsskksanlyy/auth/url-configuration:
- Site URL: https://queuepilot.boomacooks.chatgpt.site
- Redirect allowlist: https://queuepilot.boomacooks.chatgpt.site/auth/confirm and https://queuepilot.boomacooks.chatgpt.site/auth/confirm?**

In Auth > Email > SMTP Settings:
- Host: smtp.resend.com
- Port: 465
- Username: resend
- Password: the Resend sending API key, entered as a secret.
- Sender name: Quevian
- Sender email: an address at the user's verified Resend domain; do not invent it or use an unverified domain.

Use the adjacent HTML templates for Confirm signup and Reset password in Supabase Auth > Email Templates. The app uses a token-hash confirmation page followed by explicit POST verification, so a link-scanning GET does not consume the token. Default implicit fragment redirects are not implemented; these templates are required. The code-entry alternative supports signup/recovery OTPs.

Set strong password requirements and keep email confirmation enabled. Check Supabase rate limits and production sender configuration. Configure provider password-change notification if wanted. Do not turn off verification to make a test pass.

## App activation

- Set QUEVIAN_EMAIL_FROM to the verified sender (e.g. display-name plus email).
- Deploy the saved version and its additive D1 migration while email auth remains disabled.
- Verify production cookie forwarding and refresh using controlled accounts before opening signup broadly. Then set QUEVIAN_EMAIL_AUTH_ENABLED=true and deploy. Enabling the flag should be restricted to the controlled test window until acceptance checks pass.
- The app checks provider-verified identities with getUser; no decoded cookie or client-submitted user ID is trusted.
- Auth cookies are HttpOnly, Secure and SameSite=Lax. Middleware refreshes sessions and passes cookies to both the request and response, with private/no-store cache headers.
- Only verified email accounts can access Quevian. Existing unlinked owners need support-assisted identity verification before any workspace migration; never auto-link by matching email.

## Existing account migration

The self-service ChatGPT linking flow has been retired. `/auth/link` redirects to email login and `/api/auth/link` returns 404. Already-linked accounts retain their existing workspace identity after verified email sign-in. Do not delete legacy records or grant access to a newly registered account solely because its email matches.

## Acceptance checks requiring real provider configuration

- Signup, received verification email, confirmation and verified login.
- Unverified login denied; expired/used verification and recovery tokens rejected.
- Logout, cookie refresh, another browser/device, password reset and fresh login.
- Owner linking preserves the original organization and roles.
- Invitation send, provider delivery receipt/bounce inspection, correct-email acceptance, wrong-email rejection, expiry, revocation, replaced link rejection and retry after failure.
- Staff/customer and cross-organization privacy boundaries.

Automated tests cover the provider adapter with mocks, route gates, CSRF checks, rate limits, open redirects, linking requirements, invitation replacement, and email failure/retry/idempotency behavior. They are not evidence of real mailbox delivery or production authentication compatibility.

Invitation status "sent" means accepted by Resend, not delivered to an inbox. Delivery webhooks/bounce ingestion and unattended retry scheduling are not implemented in this section. Failed sends are persisted and can be retried manually. Reissuing generates a new invitation ID and invalidates the old link.
