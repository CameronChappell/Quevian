# Policy implementation and decisions before launch

Updated September 21, 2026. Policy pages reduce ambiguity; they do not prevent lawsuits or certify compliance. Get counsel licensed for the actual business and customer regions to review them before a paid launch.

## Implemented

- Public /terms, /privacy, /acceptable-use, /cookies and /billing-policy with dates, navigation, readable tables and contact channels.
- Terms cover authority, adult business use, content ownership and operational permission, misuse, AI review, availability, suspension, limited warranty/liability exclusions and preservation of mandatory rights. No compulsory arbitration, class-action waiver, invented court/venue, fixed liability cap or sweeping indemnity was inserted.
- Privacy describes actual providers, customer/organization roles, email delivery, optional AI, browser drafts, exports and reviewed deletion. It explicitly discloses that automatic backup expiry is not configured. No fixed deletion deadline, data-region guarantee, zero-retention claim or certification is advertised.
- Signup requires affirmative policy acknowledgment before requesting an email account. After verified sign-in, every interactive identity (including ChatGPT and existing users) confirms current terms, privacy acknowledgment and adult/authority status. Only that verified action creates the durable server record; unverified signup claims and editable auth metadata never grant acceptance.
- D1 legal_acceptances stores the authenticated user ID, terms and privacy versions and server timestamp. Repeated acceptance cannot overwrite its first timestamp. No additional IP or date-of-birth collection.
- Protected staff, portal and invitation pages redirect to /review-terms. Normal interactive API access requires the current terms version. Owner-only export, privacy-request and existing billing-portal routes remain available without accepting; they retain their existing authentication, tenant checks and CSRF protections. Scheduled jobs and existing machine integrations are unchanged.
- Acceptance is separate from payment authorization and marketing consent. No advertising cookie banner was added because this application has no advertising trackers.
- Policy versions live in lib/legal.ts. Preserve each published text in git; changes to terms or the incorporated AUP require a new TERMS_VERSION. Review whether privacy changes also require renewed acknowledgment or a separate consent. Never silently rewrite a version already accepted.

## Owner facts and decisions still required

1. **Identify the operator:** legal entity or sole proprietor/trading name, formation/location jurisdiction, business/contact address where required, and regions/customers served. Current pages use the existing Quevian trade name and support mailbox without inventing a corporation, address, venue or governing law. This is an unresolved disclosure/contract gap; publication is not approval for paid launch.
2. **Commercial terms:** approve prices, renewal notices, cancellation flow, refund/withdrawal rights, trial terms if any, support coverage and any SLA. Current billing text reflects implemented owner checkout/cancellation and promises no automatic discretionary refund. Counsel should assess liability limitations and whether a negotiated cap, indemnity or dispute clause is appropriate.
3. **Privacy operations:** approve purposes and legal bases for each actual activity, applicable regional rights, controller/processor duties, privacy-request deadlines and verification/appeal procedures. Confirm support@quevian.com is actively monitored for legal, privacy, accessibility, abuse and security reports.
4. **Providers and international transfers:** review executed vendor agreements, subprocessor roles, actual processing locations, retention and AI settings. Put a customer DPA, any required transfer mechanism and processor/subprocessor notification process in place before accepting customer data requiring them. Do not claim GDPR, CCPA, HIPAA, SOC 2 or other certification without evidence and appropriate review.
5. **Retention:** choose active-record, inactive-account, auth, email-provider, support, policy-acceptance and backup retention, and approve an implementation that honors valid requests and legal holds. Current backup copies have no automatic expiry; disclosure alone does not establish a lawful retention program.
6. **Operational readiness:** verify accessibility with representative users/devices, incident and breach-response procedures, insurance/business formation/tax obligations appropriate to the operator, genuine end-to-end billing/cancellation and a verified-account acceptance flow. Code tests do not establish legal compliance.

Keep QUEVIAN_LEGAL_APPROVED=false and billing disabled until these decisions and applicable review are complete. Enabling a feature flag is not legal approval by itself.

## Unapproved work remains unimplemented

An independent second-provider archive of the full application database and files, including customer data, and a 30-day expiry/deletion policy remain unapproved. This change does not create the archive, copy any production payload or enable deletion. Workspace deletion requests still record a review request rather than erase production data.

## Sources used for review

- [FTC privacy and security guidance](https://www.ftc.gov/business-guidance/privacy-security): privacy and security claims must reflect actual practices.
- [California Attorney General CCPA guidance](https://oag.ca.gov/privacy/ccpa), updated August 28, 2026: applicability and rights require assessment; the website does not assert that every business is covered.
- [Supabase SSR guidance](https://supabase.com/docs/guides/auth/server-side/advanced-guide): verified server identity and private session handling. Policy authorization is stored in the application database, never editable user metadata.

These are starting points for review, not an exhaustive jurisdictional analysis.
