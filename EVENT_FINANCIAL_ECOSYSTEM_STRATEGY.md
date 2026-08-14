# Merry Tales Event Financial Ecosystem

Research and product blueprint — 14 August 2026

## Executive decision

Merry Tales should become the **financial operating system for events**: the place where an event owner, family, planner and vendors agree what will be bought, reserve the budget, approve spending, pay safely, collect evidence and close the books.

The winning promise is:

> Plan together. Fund from anywhere. Approve every spend. Pay every vendor. Account for every coin.

This is broader than a wedding planner and narrower than a generic bank. The product owns the event workflow and financial record; regulated payment partners hold, convert and move the actual money.

Do not launch an unlicensed stored-value wallet. In Kenya, sending, receiving, storing or processing payments can fall within payment-service regulation, and e-money issuance requires Central Bank of Kenya authorisation. Start with a **provider-held Event Funds account** and a Merry Tales **double-entry sub-ledger**. Obtain Kenyan payments counsel and written partner approval before marketing terms such as wallet, escrow, savings, remittance or guaranteed protection.

## What already exists

The repository is a credible starting point:

- Events already have owner, date, country, currency and headline budget.
- Marketplace products support products, services, rentals and packages, plus deposits and availability.
- Orders and M-Pesa STK payment records exist.
- Vendors, leads, messaging, notifications and audit logs exist.
- The strategy already anticipates RFQs, milestones, vendor payouts, approvals, VAT/eTIMS and disputes.

The missing layer is financial integrity. The present `Payment` row records a provider payment against an order, but it is not a ledger and cannot safely represent available funds, reservations, split payouts, reversals, tax, FX or liabilities to vendors.

## The ecosystem: six connected products

### 1. Merry Tales Quotes — sell and procure

For organizers and vendors:

- Reusable packages, rate cards, add-ons, optional items and per-person/per-day pricing.
- Branded estimates and quotes with expiry, versions and client comments.
- Quote comparison normalized by category, quantity, tax, inclusions and exclusions.
- One-click accept, e-sign, deposit invoice and payment schedule.
- Change orders: never overwrite an accepted quote; create a revision with a visible budget delta.
- RFQs for one event category and tenders for multi-vendor/corporate work.
- Vendor cost sheet versus client-facing price, preserving planner margin privacy.
- Purchase orders and vendor bills tied to the approved scope.

Key lifecycle:

`lead → brief → quote → negotiation → acceptance → contract → deposit → milestones → completion → final invoice → review`

HoneyBook and Aisle Planner validate the demand for combined proposals, contracts, invoices, payments and client portals. Merry Tales can differentiate by making the accepted quote part of a shared event budget and local payout/tax workflow, rather than leaving finance as a vendor-only CRM.

### 2. Event Treasury — fund and control

Each event gets an Event Treasury with:

- Base/reporting currency, funding goal and contingency reserve.
- Category envelopes such as venue, catering, attire, transport and emergency.
- `available`, `reserved`, `pending`, `paid`, `refunded` and `disputed` amounts.
- Contributors with roles: owner, partner, parent, diaspora sponsor, planner, accountant and viewer.
- Approval rules by amount/category: for example, planner can spend up to KES 25,000; two approvals above KES 100,000.
- Vendor allowlists, per-transaction limits and optional virtual/payment cards only through a licensed issuer.
- Scheduled deposits and reminders.
- Cash and offline-bank entries with receipt upload and independent verification, clearly marked as unverified until reconciled.
- A close-event workflow that finds unused reservations, outstanding bills, refunds and unreconciled cash.

The user sees a wallet-like experience, but the balance shown must be derived from immutable ledger entries and reconciled to the regulated provider’s settlement account. A budget is not a cash balance; an authorization is not a completed payment; provider success is not final until a signed webhook and reconciliation confirm it.

### 3. Pay — collect, disburse and reconcile

Payment rails should be adapters behind one orchestration layer:

- Kenya: M-Pesa collection, M-Pesa B2C/B2B where the provider permits, bank transfer and cards.
- Diaspora: card or bank collection in the payer’s supported currency through a licensed cross-border partner; settlement into the provider-held Kenyan event account.
- Merry Tales-to-Merry Tales: an internal transfer instruction between verified users, executed by the underlying PSP and mirrored as balanced ledger entries. Never just decrement one database number and increment another.
- Split settlements: one checkout can allocate principal, vendor amount, platform fee, payment fee, tax and referral reward.
- Milestones: deposit on booking, a pre-event release, event-day confirmation and final release.
- Payout controls: verified recipient, beneficiary name match where available, approval policy, velocity limits, cooling-off period for newly changed payout details, and step-up authentication.
- Refunds and disputes: preserve the original transaction; post compensating entries.
- Daily automated reconciliation plus an operations queue for unmatched, duplicated, reversed or delayed transactions.

Stripe Connect documents the general marketplace pattern of separate charges and transfers to multiple connected accounts, but availability and cross-border routing are region-specific. Merry Tales must run a provider selection exercise for Kenyan entity support, M-Pesa, cards, local bank settlement, pay-outs, FX, KYC/KYB, reserves, refunds, webhooks and marketplace permission. Do not assume a global provider feature is available in Kenya merely because it exists in its documentation.

### 4. Money Desk — account for every coin

This is the trust engine and the hardest feature to copy:

- Double-entry ledger with immutable, idempotent journal postings.
- Event statement and vendor statement with opening balance, inflows, reservations, releases, fees, FX and closing balance.
- Budget-versus-committed-versus-actual dashboard.
- Receipt inbox using upload, WhatsApp/email forwarding later, duplicate detection and extraction assistance.
- Three-way match: purchase order ↔ vendor bill ↔ payment.
- Variance alerts: quote changed, quantity exceeded, duplicate invoice, payment outside envelope or missing receipt.
- Cash advance and petty-cash workflow: request, approve, disburse, retire with receipts, return remainder.
- Event profitability for organizers: revenue, vendor cost, fees, tax, referral cost, gross margin and cash position.
- Export for accountants: CSV/XLSX and later integrations, with a complete audit trail.

Suggested ledger accounts include provider cash, payment clearing, FX clearing, event funds liability, vendor payable, refunds payable, platform fee revenue, referral payable, payment fees, tax payable and suspense. Every journal must balance by currency; FX conversion needs two currency legs plus the realized spread/fee.

### 5. Tax Desk — make compliance part of the transaction

Tax must be a first-class domain, not a percentage column:

- Collect vendor legal identity, KRA PIN, residency, business form, VAT status and eTIMS status during KYB.
- Distinguish seller-of-record, platform agent and payment facilitator roles in contracts and data.
- Generate pro forma/quote documents separately from legally recognized tax invoices.
- Integrate eTIMS through the appropriate KRA-supported system-to-system route or approved integrator; store control-unit identifiers, receipt data, QR/link and submission status.
- Support vendor-issued invoice, Merry Tales-issued platform-fee invoice and buyer-initiated invoicing where law and KRA eligibility permit.
- Calculate VAT per line and tax category; support credit notes rather than editing issued invoices.
- Create a tax calendar and liability report for Merry Tales commissions, subscriptions, promotion fees and other revenue.
- Assess withholding tax for vendor services and referral/marketing commissions based on recipient, residency and transaction classification; record gross amount, withholding, net payout and certificate reference.
- Never hard-code a universal tax rate into product logic. Use dated tax rules reviewed by a Kenyan tax professional.

KRA states that all persons engaged in business must onboard eTIMS and issue electronic tax invoices. Its guidance also provides system-to-system integration and buyer-initiated invoicing. VAT registration and marketplace tax treatment depend on the entity and supply; tax counsel should confirm Merry Tales’ current obligations and whether later marketplace-liability rules change the seller/platform split.

### 6. Merry Rewards — referral and earn

Use a transparent referral ledger, not instant cash promises:

Referral objects:

- Unique code/link, referrer, referred party, campaign, attribution window and consent.
- Eligible event: verified signup, first completed booking, vendor subscription or GMV threshold.
- Reward rule: fixed amount, capped percentage, service credit or tiered ambassador commission.
- States: tracked, qualified, pending, available, paid, reversed, expired and blocked.
- Clawback window for refunds, chargebacks, self-referrals and fraud.
- Identity, payout and tax profile required before cash withdrawal.

Recommended programs:

- **Invite the couple:** service credit after the referred event completes a qualifying paid booking.
- **Invite a vendor:** organizer/vendor earns after vendor verification and first completed order—not merely signup.
- **Event ambassador:** tiered commissions for approved community partners with explicit marketing terms.
- **Vendor-to-vendor referral:** lead handoff and commission disclosed to the customer where appropriate.
- **Diaspora family invite:** fee credit for the event, avoiding a cash-like incentive before payment legitimacy is known.

Guardrails: no multi-level/downline rewards, no reward for loading money, no return advertised as investment income, no misleading “free money,” no commission on the tax/processor-fee portion, and manual review for shared devices, payout accounts, phone numbers or circular transactions. KRA lists commissions and marketing/advertising services among payments that can attract withholding tax; classification and rates must be professionally confirmed before payouts.

## The flagship diaspora experience

The product should solve a concrete journey rather than advertise generic multicurrency:

1. A couple creates a Kenya wedding with KES as the event reporting currency.
2. A contributor in the UK sees the requested KES amount, indicative GBP amount, rate timestamp, partner FX fee and guaranteed/expiry period before confirming.
3. The licensed partner collects GBP, performs required checks and settles the converted amount.
4. Merry Tales records original amount/currency, rate, fee, settled KES amount and provider references as one linked conversion.
5. The KES funds appear as available only after provider confirmation and reconciliation.
6. The couple allocates funds to envelopes; allocation does not move money.
7. An accepted photographer quote reserves budget. Approvers release the deposit to the verified vendor.
8. All parties see the same receipt and event statement, while private contributor and vendor details remain role-limited.

Important UX rules:

- Always show “you pay,” “event receives,” rate, fees and estimated delivery time before confirmation.
- Keep the event budget in one reporting currency but retain every transaction’s original currency.
- Never silently reprice an accepted quote because FX moved.
- Offer contribution privacy controls; a sponsor need not see every vendor invoice unless granted access.
- Provide downloadable proof of funds received and paid, without calling it a bank statement.

## Roles and controls

| Role | Typical powers |
|---|---|
| Event owner | Full budget visibility, invite users, final policy control |
| Co-owner | Create/approve spending within assigned policy |
| Organizer/planner | Build budget, request quotes, prepare payments; no unrestricted withdrawal |
| Contributor | Fund event, see own contributions and permitted summary |
| Accountant | Reconcile, classify, export and close books; no beneficiary changes |
| Vendor | Quote, invoice, see own receivables and receive payout |
| Merry Tales finance ops | Resolve reconciliation exceptions under dual control |

Require separation of duties: the person who changes a vendor’s payout destination should not approve the next payout; sensitive changes trigger notifications and a temporary hold.

## Architecture to add

### Core bounded contexts

1. **Commercial documents:** quote, quote version, contract, invoice, credit note, purchase order and bill.
2. **Budgeting:** plan, envelope, allocation, commitment, approval policy and approval request.
3. **Ledger:** account, journal, posting and balance projection.
4. **Payments:** intent, funding source, provider transaction, transfer, payout, refund, dispute and reconciliation item.
5. **Tax:** tax profile, rule version, calculation, fiscal document and filing/export status.
6. **Rewards:** referral, attribution, reward, hold, reversal and payout.

### Non-negotiable engineering rules

- Store money in integer minor units plus ISO currency; never use JavaScript floating-point arithmetic.
- Ledger entries are append-only. Corrections use reversals and new postings.
- Every external request and webhook has an idempotency key and raw signed-event archive.
- Do not trust redirect pages or client callbacks as payment proof.
- Separate payment status, settlement status, payout status and reconciliation status.
- Encrypt provider credentials and sensitive identity data; apply least privilege and redact logs.
- Use a transactional outbox for notifications and provider work.
- Maintain audit events for quote acceptance, policy changes, beneficiary changes, approvals and exports.
- Reconcile provider totals against ledger control accounts daily; block affected payouts on material mismatch.
- Back up and test restore procedures; financial records require retention policies rather than casual deletion.

### Conceptual data additions

Do not overload the current `Payment` table. Introduce identifiers similar to:

- `FinancialAccount`, `LedgerJournal`, `LedgerPosting`
- `EventBudget`, `BudgetEnvelope`, `BudgetCommitment`
- `ApprovalPolicy`, `ApprovalRequest`, `ApprovalDecision`
- `Quote`, `QuoteVersion`, `QuoteLine`, `QuoteAcceptance`
- `Invoice`, `InvoiceLine`, `CreditNote`, `FiscalDocument`
- `PaymentIntent`, `ProviderTransaction`, `Transfer`, `Payout`, `Refund`
- `FxQuote`, `FxConversion`
- `ReconciliationRun`, `ReconciliationItem`
- `TaxProfile`, `TaxRuleVersion`, `TaxComponent`, `WithholdingRecord`
- `ReferralCode`, `ReferralAttribution`, `Reward`, `RewardPayout`

The existing order/payment path can be adapted behind a compatibility layer while new events use the ledger-backed flow.

## Compliance and operating model

Before money movement launches, obtain written advice covering:

- Whether Merry Tales is merchant/seller of record, disclosed agent or marketplace for each product type.
- CBK licensing perimeter for collection, storage, internal transfers, scheduled release, pooled settlement and cross-border funding.
- Whether “escrow,” “wallet,” “remittance” and “savings” may be used in customer-facing copy.
- PSP safeguarding/trust account structure, insolvency treatment and customer-funds ownership.
- AML/CFT responsibility matrix: KYC/KYB, sanctions/PEP screening, transaction monitoring, suspicious-activity escalation and records.
- KRA treatment of vendor sales, Merry Tales commission and subscription income, VAT/eTIMS, withholding and referral rewards.
- Data-controller/processor roles, ODPC registration, privacy impact assessment, breach response and cross-border data safeguards.
- Consumer terms: fees, FX disclosure, payout timing, cancellations, disputes, complaints and unclaimed funds.

The Central Bank’s payments strategy emphasizes trust, security, consumer protection, data protection, interoperability and cross-border payments. Those should be product requirements: clear references and statements, real-time status where possible, delay notices, accessible complaints and provider-neutral payment adapters.

## Build sequence

### Phase 0 — decisions and controls (2–4 weeks)

- Legal/payment/tax workshops and funds-flow diagrams.
- Select one Kenyan regulated payments partner and one diaspora collection path.
- Define seller-of-record matrix by listing type.
- Threat model, KYB policy, ledger chart of accounts and reconciliation rules.
- Interview 10 organizers, 10 vendors, 10 couples/diaspora contributors and 3 accountants.

Exit gate: counsel and partner approve the exact pilot funds flow and customer wording.

### Phase 1 — quote-to-budget foundation (6–8 weeks)

- Versioned quotes, accept/decline, deposits and payment schedules.
- Event envelopes, commitments and manual/offline expense tracking.
- Approval policies and audit history.
- Vendor bills, receipt uploads and budget/actual reporting.
- Double-entry ledger in shadow mode behind existing M-Pesa orders.

Exit gate: every pilot transaction balances, and finance can explain every displayed number from source documents.

### Phase 2 — controlled Event Funds pilot (8–12 weeks)

- Provider-held event funding via M-Pesa and card/bank where approved.
- Verified vendor onboarding and single-vendor payouts.
- Milestone release, refunds, webhook idempotency and daily reconciliation.
- Operations console for exceptions and dual approval.
- Statements and close-event workflow.

Pilot limits: invited Nairobi organizers, modest transaction caps, no cash withdrawal, no user-to-user general-purpose transfers and manual review of changed beneficiaries.

### Phase 3 — Tax Desk and organizer business suite (6–10 weeks)

- Invoice/credit-note lifecycle, eTIMS integration path and tax profiles.
- Planner profitability, vendor payables and receivables.
- Purchase orders, three-way matching and accountant export.
- Tax liability reports and withholding workflow after professional validation.

### Phase 4 — diaspora and Merry-to-Merry (8–12 weeks)

- Transparent FX quotes and original-currency records.
- Licensed partner cross-border collection and local settlement.
- PSP-executed transfers between verified Merry Tales accounts.
- More payout rails and provider failover only after reconciliation reliability is proven.

### Phase 5 — referral and ecosystem growth (4–6 weeks)

- Referral attribution, pending rewards, clawbacks, fraud rules and tax profile.
- Start with event credits; unlock cash payouts only for verified eligible earners.
- Vendor partner/referral marketplace and performance analytics.

Do not lead with referrals before the core transaction is trustworthy; otherwise incentives amplify fraud and support costs instead of product-market fit.

## Monetization

Use explicit, separately disclosed revenue lines:

- Organizer Pro subscription: quotes, contracts, team approvals and reports.
- Vendor Pro subscription: pipeline, templates, invoices, analytics and faster operations tools.
- Marketplace commission on completed bookings.
- Event Treasury/admin fee where legally and contractually permitted.
- Cross-border/FX fee or partner revenue share with transparent pricing.
- Promoted listings, clearly labeled.
- Corporate procurement fee.
- Optional protection/dispute service only after legal design and reserve economics.

Never hide platform revenue in exchange rates or label a platform-controlled hold as guaranteed escrow.

## Metrics that prove trust

North-star candidate: **reconciled event GMV** — completed event spend for which the quote/order, payment, ledger and recipient all reconcile.

Operational guardrails:

- Ledger/provider reconciliation match rate and age of exceptions.
- Percentage of spend linked to approved quote/PO and receipt.
- Payout success and median time to recipient.
- Duplicate webhook/payment rate and idempotency failures.
- Refund/chargeback/dispute rate and loss rate.
- Budget variance and unused-reservation rate at event close.
- Quote acceptance, deposit conversion and days-to-payment.
- Vendor KYB completion and eTIMS-ready rate.
- Referral qualification, reversal, fraud and payback rates.
- Support contacts per 100 payments and complaint resolution time.

Release targets should include 100% balanced journals, 100% auditable privileged actions and zero payouts from unreconciled provider funds.

## Ideas that expand the events world later

Once the treasury and ledger are reliable, Merry Tales can add defensible adjacent tools:

- Group gifting and cash registries routed into approved event goals.
- Guest-paid experiences, transport seats or accommodation blocks.
- Ticketed pre-events and post-event media/product upsells.
- Vendor working-capital referrals through licensed lenders, based on verified receivables—not lending from event funds.
- Event insurance referrals through licensed insurers/intermediaries.
- Corporate event cards, cost centers and procurement approvals through an issuer.
- Cooperative buying: planners aggregate rentals, printing or supplies while each event retains its own accounting.
- Refundable rental/security-deposit tracking with evidence and release rules.
- Sustainability ledger: reusable inventory, food surplus and carbon estimates, separate from financial claims.
- AI assistance for quote normalization, anomaly detection and budget forecasting; never let AI autonomously release money.

## Immediate product slice

The best first shippable slice is **Quote → Accept → Reserve Budget → Collect Deposit → Vendor Bill → Reconcile** for one organizer, one event and one vendor.

It demonstrates the entire thesis without prematurely enabling a general-purpose wallet. A user should be able to answer, from one screen:

1. What did we agree to buy?
2. Who approved it?
3. How much money is actually available?
4. What is committed but not yet paid?
5. Who received what, when and through which reference?
6. What fees and taxes applied?
7. Which receipt or invoice proves it?
8. What remains to close the event?

If Merry Tales answers those eight questions reliably, it is no longer “another event planner.” It becomes infrastructure for event commerce.

## Sources and research notes

Primary Kenyan and regulatory sources:

- [Central Bank of Kenya — National Payment System Regulations, 2014](https://www.centralbank.go.ke/wp-content/uploads/2018/12/NPSRegulationsNew2014-1.pdf)
- [Central Bank of Kenya — PSP authorisation procedures](https://www.centralbank.go.ke/images/docs/NPS/Regulations%20and%20Guidelines/Authorisationprocedurespaymentserviceprovider2014.pdf)
- [Central Bank of Kenya — Money Remittance Regulations, 2013](https://www.centralbank.go.ke/wp-content/uploads/2016/08/The-Money-Remittance-Regulations-2013.pdf)
- [Central Bank of Kenya — National Payments Strategy 2022–2025](https://www.centralbank.go.ke/wp-content/uploads/2022/02/National-Payments-Strategy-2022-2025.pdf)
- [KRA — eTIMS](https://www.kra.go.ke/online-services/etims)
- [KRA — eTIMS learning and eligibility guidance](https://www.kra.go.ke/helping-tax-payers/faqs/learn-about-etims)
- [KRA — VAT](https://www.kra.go.ke/individual/filing-paying/types-of-taxes/value-added-tax)
- [KRA — Withholding tax](https://www.kra.go.ke/helping-tax-payers/faqs/everything-about-withholding-tax)
- [KRA — VAT on digital marketplace supply](https://www.kra.go.ke/helping-tax-payers/faqs/vat-on-digital-marketplace-supply)
- [Office of the Data Protection Commissioner — regulatory framework](https://www.odpc.go.ke/data-protection-laws-kenya/)
- [Office of the Data Protection Commissioner — data-subject rights](https://www.odpc.go.ke/rights-of-a-data-subject/)
- [FATF — risk-based approach to prepaid cards, mobile and internet payments](https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Rba-npps-2013.html)

Product and architecture benchmarks:

- [HoneyBook — client, proposal, contract, invoice and payment workflow](https://www.honeybook.com/)
- [Aisle Planner — event business and planning workflow](https://help.aisleplanner.com/en/)
- [Stripe Connect — marketplace charge models](https://docs.stripe.com/connect/charges)
- [Stripe Connect — separate charges and transfers](https://docs.stripe.com/connect/separate-charges-and-transfers)

This document is a product and technical strategy, not legal or tax advice. Kenyan counsel, a qualified tax adviser and each regulated provider must validate the final operating model, rates, documents and customer-facing terminology before launch.
