# Business decisions required before paid launch

The public /privacy page describes implemented data handling. /terms currently provides the support contact and states that creating an account does not authorize a charge. Full prepared terms are in app/terms/page.tsx behind QUEVIAN_LEGAL_APPROVED=false. Do not enable the flag until this review is complete.

The owner must provide the legal seller name, business/contact address where required, jurisdiction and customer regions. Confirm whether business formation and tax registrations are complete; application code cannot establish those facts.

Prepared commercial terms for review:

- USD $19 per staff seat monthly or $180 per staff seat annually, paid upfront for the selected period, before applicable tax.
- Automatic renewal until the owner cancels. Cancellation ends renewal at the end of the current paid period.
- Owner-authorized seat changes may immediately invoice prorations; no reduction below active staff and pending invitations.
- Billing errors and refund requests go to support@quevian.com. No blanket automatic refund is promised; non-waivable legal rights remain unaffected. The owner must approve or replace this refund policy.
- No advertised 24/7 coverage, response SLA, regulatory certification, or suitability for regulated data. The owner must choose actual support hours/staffing before advertising them.
- Customer content belongs to the customer; processing is authorized only to operate, support, secure and recover the service. Account access and deletion requests are verified.

Review the proposed terms and privacy notice with appropriate counsel for the actual company and sales regions. Review vendor agreements and any needed data-processing agreement before accepting customers with those requirements. These drafts are not a certification of legal compliance.

Deletion requests are recorded for operator review; no automatic production data deletion or backup expiry is enabled. Choose active-record retention, inactive-account retention, provider mail retention and backup retention, and approve the corresponding deletion implementation separately. A requested second-provider backup archive with 30-day expiry was blocked by automatic approval review pending explicit approval of payload, destination and retention. It has not been created.
