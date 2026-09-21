# Connect app.quevian.com

The custom domain has been created on the existing Quevian Site. It is pending DNS verification. Keep Google Workspace MX, SPF and DKIM records intact.

In Namecheap → Domain List → quevian.com → Advanced DNS, add these records (automatic TTL):

| Type | Host | Value |
| --- | --- | --- |
| CNAME | app | custom-domains.chatgpt.site. |
| TXT | _openai-site-verification.app | openai-site-verification=E04GkjUg08Nd7dshK1wMxfkF3l-KzSUSLjEwaqmfX7E |
| TXT | _cf-custom-hostname.app | 015cba6f-2ee6-4614-8cc1-ea840cb55a16 |

If a record already exists for one of these exact hosts, review it before replacement. Do not edit unrelated root-domain or mail records. Domain ownership proof values above are public DNS records, not API credentials.

After the owner saves DNS, refresh domain status through Sites. Wait for verified domain and active SSL. Then set QUEVIAN_SITE_URL to https://app.quevian.com, update the Supabase Auth Site URL and allowed redirects used in docs/auth/ACTIVATION.md, update the Vault job origin, and republish. Test login, reset, invitations and checkout redirects on the custom domain. Existing mail webhooks can remain on the working Sites URL during the transition; migrate them only after verification.

Do not switch the application origin while DNS/SSL is pending. The existing working URL is https://queuepilot.boomacooks.chatgpt.site.
