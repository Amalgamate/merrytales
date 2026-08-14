# Merry Tales Delivery Operating Model

Research and implementation baseline — 14 August 2026

## Product placement

Delivery must appear where it matters, without changing Merry Tales into a courier brand:

- Public shop: delivery area, lead time, pickup eligibility and estimated delivery promise on the listing.
- Checkout: recipient, validated address, landmark, instructions, method, fee and secure-handoff explanation.
- Customer workspace: split-shipment tracking, seller identity, ETA, courier contact, event timeline and delivery PIN.
- Vendor workspace: a delivery desk for preparing, readying, assigning, dispatching, exception handling and proof of handoff.
- Event Treasury: only delivery charges, approval and reconciliation—not operational courier controls.
- Operations/admin: exceptions, partner health, delayed deliveries, refunds and dispute evidence in a later phase.

## Experience standard

The intended journey combines the strongest patterns used by modern mobility and commerce products:

1. The customer sees fulfillment terms before adding an item.
2. Checkout captures a deliverable address and clearly prices delivery.
3. A multi-vendor basket becomes separate vendor shipments under one order.
4. Each shipment gets a tracking code, seller, ETA, timeline and recipient PIN.
5. The vendor progresses a constrained state machine; invalid status jumps are rejected.
6. Courier identity and contact appear when assigned.
7. The customer sees pickup, transit, arriving and delivery events.
8. The final handoff requires the customer’s PIN; the customer is warned not to share it early.
9. Failed delivery becomes an explicit exception and can proceed to reattempt or return.
10. All status changes remain append-only timeline evidence.

Uber Direct supports PIN, photo, signature, barcode and identity proof depending on risk. Uber’s consumer flow uses a PIN to confirm the recipient and has an unable-to-deliver/return path. Bolt exposes live courier location after pickup and supports courier contact. Shopify distinguishes unfulfilled, ready for delivery and delivered, with notification triggers tied to fulfillment events. Merry Tales adopts these principles while keeping event commerce—not courier dispatch—as the core brand.

## Implemented lifecycle

`PENDING → PREPARING → READY_FOR_PICKUP → COURIER_ASSIGNED/PICKED_UP → IN_TRANSIT → ARRIVING → DELIVERED`

Exception branches:

- `IN_TRANSIT/ARRIVING → DELIVERY_FAILED → COURIER_ASSIGNED` for a reattempt.
- `DELIVERY_FAILED → RETURNING → RETURNED` when delivery cannot complete.
- `DELIVERED → RETURN_REQUESTED → RETURNING → RETURNED` for an approved return.
- Early states may be cancelled under controlled transitions.

The order becomes `DISPATCHED` when a shipment reaches transit and `DELIVERED` only when every non-cancelled shipment is complete.

## Data and security rules

- Each physical vendor group receives a separate `Fulfillment`; digital products do not create shipments.
- Customer order access is owner-scoped. Vendor access is vendor-scoped.
- Vendors never receive the delivery PIN from list APIs; they must obtain it from the recipient at handoff.
- The customer sees the PIN only inside their authenticated order workspace.
- Status transitions are server-enforced, not trusted from the UI.
- Every transition creates an immutable `FulfillmentEvent` with time, actor and optional location/detail.
- Courier webhooks must later be signature-verified and idempotent.
- PIN storage should move from the current pilot field to encrypted-at-rest or provider-managed verification before production.
- Precise live location needs explicit retention, access and privacy rules; do not store endless courier traces.

## Delivery pricing baseline

The pilot uses transparent checkout tariffs:

- Nairobi: KES 500
- Kiambu: KES 700
- Mombasa: KES 1,200
- Other supported county: KES 1,000 fallback
- Customer pickup: no delivery charge
- Digital-only cart: no delivery charge

These are product-development defaults, not commercial recommendations. Production pricing should use partner quotes based on pickup, drop-off, vehicle, size/weight, urgency, return risk and service level. The backend must always calculate the charged fee; client calculations are display estimates.

## Partner adapter required next

A delivery provider adapter should expose:

- Quote: origin, destination, parcel constraints, vehicle and service level.
- Create/cancel delivery.
- Assign courier and return courier identity/vehicle/contact subject to partner policy.
- Signed webhook ingestion with idempotency.
- Tracking URL and/or privacy-limited coordinates.
- Pickup/drop-off proof: PIN first, then photo/signature/barcode by risk.
- Failed attempt reason, waiting time, reattempt and return quote.
- Provider invoice and transaction reference for Treasury reconciliation.

Keep Merry Tales provider-neutral. A shipment may be vendor-delivered, customer pickup or handled by a contracted courier. Do not promise live maps until a contracted partner provides reliable location data and consent terms.

## Operational service levels

Measure per vendor, courier and route:

- Acceptance time and preparation time.
- Ready-to-pickup aging.
- Courier assignment and pickup latency.
- ETA accuracy and on-time delivery rate.
- First-attempt success.
- PIN/proof completion rate.
- Damage, loss, wrong-item and return rates.
- Support contacts per 100 deliveries.
- Time to resolve failed delivery.
- Delivery-fee margin and provider reconciliation match.

Suggested alerts:

- Paid order still pending after the listing preparation SLA.
- Ready shipment without courier assignment.
- Courier assigned but pickup overdue.
- In-transit shipment with no events beyond a route-specific threshold.
- Delivery marked complete without required proof.
- Repeated failed deliveries to the same vendor, courier, address or account.

## Event-specific extensions

Events require capabilities generic retail often misses:

- Deliver to a venue, planner, family member or event-day receiving desk.
- Appointment windows rather than vague same-day promises.
- Bulk rentals with both outbound and return legs.
- Setup/installation proof separate from package delivery.
- Chain of custody for cakes, flowers, jewellery, attire and printed materials.
- Multi-stop drops for gifts, invitations and corporate kits.
- Event-date risk alerts when the delivery buffer becomes unsafe.
- Rental condition photos, deposit holds and return inspection.

## Sources

- [Uber Direct — proof of delivery options](https://developer.uber.com/docs/deliveries/guides/proof-of-delivery)
- [Uber Courier — PIN handoff and failed-delivery flow](https://help.uber.com/en/driving-and-delivering/article/uber-courier-faq?nodeId=8e4952cb-c44e-4957-a39d-08b5dd7db13f)
- [Uber Package — sender and recipient tracking](https://www.uber.com/us/en/newsroom/uber-connect-holiday/)
- [Bolt Food — live courier tracking](https://bolt.eu/en-uk/support/articles/360007191740/)
- [Shopify — local delivery fulfillment workflow](https://help.shopify.com/en/manual/fulfillment/fulfilling-orders/local-delivery-fulfillment)

This is a product and technical operating model. Partner contracts, Kenyan transport requirements, insurance, prohibited-item policies, consumer terms and data-protection review are required before public launch.
