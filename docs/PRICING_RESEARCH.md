# Quevian pricing research

Reviewed 19 September 2026. USD unless noted. Published competitor prices are a market reference, not a claim that products have identical capabilities. Prices can change; verify again before activating billing.

## Official market references

| Product | Entry plan | Higher plans | Billing basis | Source |
| --- | --- | --- | --- | --- |
| Freshdesk | Growth $19 | Pro $55; Enterprise $89 | Per agent/month, billed annually | https://www.freshworks.com/freshdesk/pricing/ |
| Zendesk | Support Team $19 | Suite Team $55; Suite Professional $115 | Per agent/month, paid yearly | https://www.zendesk.com/pricing/ |
| Freshservice | Starter $19 | Growth $49; Pro $99 | Per agent/month, billed annually | https://www.freshworks.com/freshservice/pricing/ |
| Help Scout | Standard $25 | Plus $45; Pro $75 | Per user/month as displayed; billing-toggle basis not explicit in retrieved text, excluded from annual comparisons | https://www.helpscout.com/pricing/ |

Freshdesk and Freshservice are both Freshworks products; Zendesk and Help Scout provide independent-company comparisons. Zoho's page returned INR and Halo's page did not expose a numeric price, so neither was used for the USD benchmark.

## Chosen public positioning

One **Quevian Workspace** plan: $19 per staff member each month, or $180 per staff member paid annually (equivalent to $15/month). Annual savings: $48/seat/year, 21.05% relative to 12 monthly payments, displayed as 21%. Customer-only portal users are excluded from staff seats. All prices are before applicable taxes.

This places the annual rate below the $19 annual entry prices from Freshdesk, Zendesk and Freshservice, while keeping the offer simple. Commercial viability still needs to be evaluated against operating costs, support effort and customer feedback.

The page describes capabilities present in the workspace: tickets, portal, dispatch, time tracking, projects, customer/asset records, reports and permissions. It does not promise enterprise SLAs, AI, SSO, unlimited usage, production email delivery or third-party integrations. A single plan avoids inventing unimplemented feature gates.

## Current purchase behavior

The page presents standard Workspace pricing with a **Get started** button. Signup buttons open the existing signup flow; no payment information is collected, no subscription is created and selecting a billing frequency does not reserve a price. Customers must agree to a subscription before billing starts. This copy update does not change payment functionality.

The calculator accepts 1–500 whole-number staff seats, defaults to five, and shows either monthly cost or the monthly equivalent plus the full annual upfront amount. This range is a calculator boundary, not a tested capacity guarantee.

## Payment integration work

Implement recurring checkout and subscription state, staff-seat metering, tax handling, cancellation/refund terms and explicit customer acceptance. Validate costs and pricing with pilot teams. These remain separate work; the pricing-page change does not implement a payment system.
