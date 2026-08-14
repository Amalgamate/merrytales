# Merry Tales: Kenya's Event Commerce Marketplace

## Positioning

Merry Tales should be the transaction and logistics layer for occasions: find a provider, compare a package, book or buy it, pay safely, coordinate delivery, and review the outcome. It combines a service marketplace, rental marketplace, product catalogue, corporate procurement desk and event operations workspace.

## Evidence from the Kenyan market

- Purpink demonstrates demand beyond flowers: corporate gifting, hampers, personalised merchandise, baby gifts, stationery, drinkware, jewellery, cards, chocolates and nationwide fulfilment. Its corporate catalogue advertises bulk branding, invoicing and delivery to multiple Kenyan locations: https://www.purpink.co.ke/collections/corporate-gifts
- Purpink's baby catalogue includes newborn hampers, toys, blankets, cards and personalised baby products: https://www.purpink.co.ke/collections/baby-gifts
- Kenyan event suppliers already bundle MC, photography, PA, tents and catering, showing customers prefer coordinated procurement: https://www.kekeevents.com/
- Public event tenders include livestreaming, LED screens, portable sanitation, hostesses, guards, bouncers, riggers and technicians in addition to tents and photography. These are marketplace categories, not edge cases.
- Corporate gifting platforms serve employee recognition, customer appreciation, sales, milestones and event engagement, making B2B recurring purchasing a distinct product line.

## Marketplace supply taxonomy

The application taxonomy lives in `apps/web/src/data/marketplace.ts`. Its 18 departments cover planning, venues, catering, decor, media, talent, technical production, rentals, transport, printing, fashion, jewellery, gifts, baby and kids, corporate procurement, staffing and safety, experiences, and digital creative services.

## Listing types

Every vendor shop should eventually support four listing types:

1. Products — stocked, made-to-order or personalised goods.
2. Services — fixed price, hourly, per-person, per-day or request-a-quote.
3. Rentals — dated inventory with deposits, quantity and return conditions.
4. Packages — several products and services bundled around an outcome.

## Required marketplace capabilities

- Multiple offerings per vendor, variants, add-ons, lead time and service area.
- Availability calendars for people, vehicles, venues and rental inventory.
- RFQ and tender workflows for large events and corporate procurement.
- Split payments, deposits, milestones, refunds and vendor payouts.
- Delivery and event-day logistics tracking.
- Verified identity, business documents, portfolio and customer reviews.
- Comparison, saved lists, collaborative approval and budget controls.
- Bulk upload, bulk pricing, VAT/eTIMS invoices and purchase orders.
- Dispute handling, cancellation rules and marketplace audit logs.

## Commercial model

- Transaction commission on paid bookings and product orders.
- Vendor subscriptions for enhanced storefront, analytics and lead tools.
- Promoted listings with clear advertising labels.
- Corporate procurement and fulfilment fees.
- Payment, delivery, protection and financing services where licensed partners permit.

## Sequencing

1. Build depth in Nairobi across events, printing, gifting and transport.
2. Add quote comparison, rental availability and vendor payouts.
3. Launch corporate accounts with approvals, bulk gifting and invoicing.
4. Expand verified supply county by county using category-level coverage targets.
5. Add logistics orchestration only after supply quality and transaction reliability are measurable.

Do not launch all categories as unmoderated classifieds. Each department needs verification rules, listing attributes, cancellation terms and service-level standards appropriate to its risk.
