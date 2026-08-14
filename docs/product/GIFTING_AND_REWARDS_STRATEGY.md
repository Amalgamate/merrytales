# Merry Tales Gifting, Registries and Rewards Strategy

Version 1.0 — Kenya product concept, 14 August 2026

## Product thesis

Merry Tales should become the gifting layer around every life and corporate event: discover what matters, collect or purchase safely, attach a message/memory, fulfil through verified vendors, and make thanking the giver effortless.

The defensible advantage is not a generic wallet. It is the event graph already inside Merry Tales: host, guests, date, preferences, registry, tickets, vendors, delivery, memories and corporate relationships. Use that context with permission to make gifting relevant, while allowing users to export data and avoid forced lock-in.

## Separate the money models

1. **Direct gift purchase:** giver buys an approved item/service for a recipient. This is ordinary marketplace commerce.
2. **Registry/group gift:** contributors fund a specific approved item or disclosed event goal. A licensed payment partner collects and settles; Merry Tales tracks allocations.
3. **Partner voucher (“Merry Tales Gift Pesa”):** a digital voucher issued/redeemed through a contracted authorized payment/voucher partner. Merry Tales supplies UX and event context, not unlicensed stored value.
4. **Cashback/reward credit:** a non-withdrawable promotional discount funded by Merry Tales/vendor, usable only under clear terms. Keep it separate from customer money and never imply it is cash.
5. **Ticket sponsorship:** giver purchases a defined ticket/seat/meal/transport entitlement for a named recipient or an organizer-controlled beneficiary pool.

Never combine these balances in one number. Show `Gift contribution`, `Partner voucher`, `Promotional reward`, and `Refund` separately, each with source, restrictions, expiry and refund route.

## Product lines

### Gift Registry

- Wedding, ruracio/traditional ceremony, baby shower, birthday, graduation, housewarming, memorial/support, corporate event and charity templates.
- Add marketplace products, vendor packages and experiences.
- Group gifting with progress, private contribution option and giver identity controls.
- “Most needed”, quantity, alternatives, colour/size, delivery-after-event and duplicate prevention.
- Universal wish links may be shown, but checkout outside Merry Tales must be clearly disclosed.
- Thank-you tracker, personalized note/video, gift timeline and delivery scheduling.
- Hosts choose whether an item is delivered, converted to an approved substitute, or kept as vendor credit; no unilateral cash conversion.

### Gift an Experience

Book approved dining, spa, photography, staycation, travel, class, concert or vendor service for a date or flexible redemption period. Show blackout dates, capacity, transferability, cancellation and expiry before payment.

### Sponsor a Bride, Couple or Guest

- Gift a bridal fitting, makeup session, bouquet, transport, accommodation, photo book or honeymoon activity.
- “Sponsor a seat”: meal + venue seat + invitation entitlement, not merely a downloadable QR code.
- “Pay it forward”: organizer allocates sponsored tickets to a beneficiary list without exposing recipients publicly.
- Giver may be anonymous to the recipient but never anonymous to payments/fraud systems.
- A ticket cannot be resold unless the event policy and applicable law allow it; transfers invalidate the old QR token.

### Digital Gift Send

Sender selects amount/item, recipient phone/email, delivery time, occasion, message and optional video/audio. Recipient verifies the destination before viewing or redeeming. Avoid exposing wedding, pregnancy, health, family or relationship details in SMS lock-screen previews.

### Corporate Gifting Centre

- HR/client campaign, budgets, approval workflow, CSV/API recipient import, branded messages and scheduled dispatch.
- Recipient-choice campaigns: recipient chooses one approved gift within budget instead of receiving unwanted inventory.
- Employee milestones, customer appreciation, channel rewards, conference speaker gifts and event delegate packs.
- Cost centres, PO/invoice/eTIMS records, delivery confirmation, unredeemed-value reporting and privacy-safe analytics.
- Cash-equivalent employee rewards may have payroll/tax consequences; corporate customer remains responsible with clear reporting and adviser sign-off.

### Diaspora Gifting

Accept international cards/remittance only through capable regulated partners, show FX and fees before payment, screen fraud, and settle vendors in KES. Let diaspora contributors buy specific gifts or contribute to approved goals rather than sending uncontrolled funds.

## Partner strategy

Issue an RFP to GiftPesa, eZawadi and CBK-authorized PSPs. Validate legal entity, CBK authorization and exact approved services directly—website marketing is not proof.

Partner must support:

- M-Pesa/card/USSD where relevant, named sub-ledgers and API webhooks;
- restricted merchant/category redemption and partial redemption;
- refunds, reversals, expiry/unclaimed-value rules and reconciliation;
- KYC/AML/fraud allocation, transaction receipts and complaints SLA;
- data-processing agreement, breach SLA, deletion/export and audit rights;
- settlement safeguarding, insolvency treatment and daily reporting;
- uptime, idempotency, signed webhooks, sandbox and disaster recovery;
- transparent commercial model and no unauthorized cross-marketing.

Branding should say “Merry Tales Gift Pesa, powered/issued by [partner]” where legally accurate. Never imply Merry Tales is the issuer or that value is deposit-insured unless confirmed in writing.

## Cashback architecture

Cashback is best launched as **Merry Points**, not money:

- Earn on completed, non-refunded orders—not at checkout.
- Pending until return/dispute window closes.
- Funded by vendor, Merry Tales or a campaign sponsor and recorded separately.
- Redeem as a capped discount on a future eligible order; no cash withdrawal, peer transfer or purchase of another voucher.
- Reverse proportionally on refund/chargeback.
- Display exact value, sponsor, eligible categories, minimum spend, cap, activation and expiry before purchase.
- One account/device/payment instrument rules, velocity limits and referral self-dealing detection.
- Do not personalize offers from sensitive event/family data without valid consent. Provide simple marketing opt-out.

Suggested launch economics: base earn 1%; vendor-funded campaign 2–5%; redemption cap 20% of the next order; 30-day pending period; 90–180 day clearly disclosed use period after activation. Finance must model accounting liability and tax before launch.

Avoid random “win your wedding” cashback or prize wheels until betting/lottery and promotional-competition counsel approves the mechanic. Guaranteed, disclosed cashback is operationally safer than chance-based rewards.

## Business model

- Marketplace commission on physical/experience gifts.
- Registry service fee paid transparently by host or contributor—never hidden in the contribution amount.
- Corporate SaaS/campaign fee plus fulfilment margin.
- Vendor-funded cashback/promotions with sponsored ranking label.
- Gift wrapping, scheduled delivery, personalization, branded merchandise and memory-video add-ons.
- Partner revenue share on vouchers only after legal, consumer and tax review.

Do not rely on breakage (unused gifts) as the value proposition. Unredeemed balances create trust, accounting and potentially regulatory problems. Prefer reminders, recipient choice, extensions, refund/substitution rules and transparent treatment.

## Trust controls

- Registry owner identity and event verification; risk-based limits for cash-like goals.
- Approved marketplace items only; recipient cannot convert a product gift into unrestricted cash.
- Contribution velocity/device/card/phone controls; 3-D Secure where available.
- Private registry option, share token, contributor controls and anti-scraping.
- No public display of amounts or giver names without affirmative choice.
- Item reservation with timeout to prevent duplicates.
- Immutable ledger: authorization, capture, allocation, fulfilment, reward accrual, reversal and refund.
- Daily order/PSP/vendor/ledger reconciliation; no payout from an unreconciled balance.
- Clear scam warnings: Merry Tales never asks recipients to pay a “release fee”.
- Registry/event cancellation waterfall defined before launch.

## Core journeys

**Send a gift:** choose recipient → item/value → message/date → pay through PSP → recipient verifies → accept/choose address or eligible alternative → vendor fulfils → giver receives consented status → thank-you flow.

**Group gift:** host selects item/goal → contributors fund portions → PSP holds/settles under approved model → goal reached or deadline closes → stated success/shortfall rule runs → fulfil/refund → receipts and reconciliation.

**Gift ticket:** giver selects event entitlement → recipient identity/contact → organizer approval if required → payment → one-time token → transfer/revoke controls → scan audit.

## Required data model

- `GiftRegistry`, `RegistryItem`, `GiftOrder`, `GiftRecipient`, `GiftContribution`
- `GiftMessage` with scheduled delivery and consent-safe preview
- `VoucherProgramme`, `PartnerVoucher`, `VoucherRedemption`
- `RewardCampaign`, `RewardLedgerEntry` with pending/available/reversed/expired states
- `SponsoredTicket`, `TicketAssignment`, `TicketScan`
- `CorporateGiftCampaign`, budget, approver, recipient-choice catalogue
- Double-entry ledger references to PSP transaction, marketplace order, refund and vendor settlement

Never update balances directly. Append ledger entries and calculate balances from reconciled entries.

## Phased launch

## Public-surface allocation

- Main navigation: first-class `Gifts` entry; `Partners` as a business ecosystem entry.
- Homepage upper journey: gifting message directly after the core Create/Shop/Find proposition, linking to registries, direct gifts and sponsored moments.
- Homepage lower trust layer: partner ecosystem after marketplace/vendor proof and before the final conversion area.
- Dedicated `/gifts`: consumer education and entry into gift shopping, registries, group gifts, sponsored tickets and corporate gifts.
- Dedicated `/partners`: integration categories, due-diligence standard and partnership intake; potential partners must never be presented as live integrations.
- Footer: durable Gifts & Registries and Partners & Integrations discovery.
- Later authenticated surfaces: customer Registry & Gifts workspace, Corporate Campaign workspace, Partner Developer Portal and admin Integration Operations.

## Integration platform roadmap

Build a provider-neutral integration layer rather than hard-coding one company. Each connector needs capability flags (`collections`, `voucher_issue`, `voucher_redeem`, `sms`, `settlement`, `refund`, `delivery`), environments, credentials vault references, signed webhook keys, health status, incident state, service areas, fee configuration and reconciliation adapters. Admin must be able to disable a capability or provider without disabling unrelated commerce.

Planned integration domains: voucher/gifting, PSP/mobile money/banks, messaging, email/WhatsApp, identity/KYC, eTIMS/tax, delivery/fulfilment, ticket scanning, corporate HR/procurement, analytics/consent and cross-border payments. Every partner progresses through `PROSPECT → DUE_DILIGENCE → CONTRACTED → SANDBOX → PILOT → LIVE → SUSPENDED/OFFBOARDED`.

### Phase 1 — lowest regulatory complexity

Gift an approved product/service, registries, item reservation, group purchase of a named item, messages, gift wrap/delivery and thank-you tracking. PSP settles each commerce order normally.

### Phase 2

Partner-issued vouchers, recipient-choice corporate campaigns, sponsored tickets and 1% non-withdrawable Merry Points after legal/payment/tax sign-off.

### Phase 3

Diaspora payments, multi-contributor cash goals, deep corporate API and charity/community campaigns after enhanced KYC, safeguarding and cross-border review.

Do not launch an internal transferable balance, cash-out wallet, lending, advance against registry contributions or universal merchant redemption without a separately approved regulated structure.

## Success measures

Registry creation-to-first-contribution, gift conversion, average contributors/registry, group-gift completion, duplicate rate, gift acceptance, fulfilment time, thank-you completion, corporate repeat rate, cashback incremental margin, redemption rate, fraud/refund/dispute loss, unredeemed liability and recipient NPS. Measure incremental orders versus rewards given; gross redemption alone does not prove profitable loyalty.

## Decisions required before build

1. Is Merry Tales only marketplace/technology provider, or does a partner formally issue vouchers?
2. Who legally holds contribution funds and under what safeguarding/refund rules?
3. Are cash goals allowed at launch or only named goods/services?
4. Who funds each reward and owns unused liability?
5. What happens on cancelled events, failed goals, deceased/unreachable recipient or vendor failure?
6. Which data may giver, recipient, host, vendor and corporate administrator see?
7. Which partner is authorized for each payment activity—not merely “licensed” generally?

The launch recommendation is Phase 1 plus partner procurement. It produces real marketplace GMV and cultural value quickly without turning Merry Tales into a shadow bank.
