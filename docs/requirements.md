# Asri Collection — Requirements v1.0.0

**Status:** Approved baseline  
**Scope:** Blueprint and requirements only. This document does not authorize implementation, database mutation, merchant configuration, payment activity, merge, or deployment.

## 1. Product identity

- Store: Asri Collection
- Tagline: Tampil Elegan, Setiap Hari
- Application: responsive e-commerce web application
- Currency: IDR
- Checkout: guest checkout; account registration is not mandatory
- Payment gateway: Midtrans Snap
- Shipping: flat rate Rp52.000 per order (subject to final shipping-policy confirmation if the business rule changes)

## 2. Functional requirements

| ID | Requirement | Priority |
|---|---|---|
| F-01 | Homepage displays store identity, navigation, banners and featured products. | P0 |
| F-02 | Product catalog loads active products from the Supabase-backed product service. | P0 |
| F-03 | Product detail displays product images, description, price, available options and stock/availability. | P0 |
| F-04 | Shopping cart supports add, remove and quantity changes. | P0 |
| F-05 | Checkout collects customer name, email, phone and shipping address. | P0 |
| F-06 | Backend recalculates product prices, shipping and order total; client totals are untrusted. | P0 |
| F-07 | Backend validates stock/availability and creates an order with immutable item-price snapshots. | P0 |
| F-08 | Backend creates a Midtrans Snap transaction for the persisted order. | P0 |
| F-09 | Customer can select a payment method offered by the merchant's active Midtrans configuration. | P0 |
| F-10 | Midtrans notification endpoint verifies the notification with server-side credentials and transaction/order binding. | P0 |
| F-11 | Payment and order statuses are updated only after valid server-side verification or trusted reconciliation. | P0 |
| F-12 | Payment result page displays the latest backend-confirmed transaction status. | P0 |
| F-13 | Customer can look up an order using its order number through a suitably protected lookup flow. | P1 |
| F-14 | Payment notifications are recorded for audit and duplicate-event handling. | P0 |
| F-15 | Duplicate and out-of-order notifications are handled idempotently. | P0 |
| F-16 | Seven merchant-evidence screenshots can be captured from the working application. | P0 |

## 3. Seven merchant activation stages

1. **Homepage** — screenshot of the actual store homepage.
2. **Product Catalog** — available products with names and prices.
3. **Product Detail** — product image, description, price and selectable options where applicable.
4. **Shopping Cart** — selected products, quantities and order totals.
5. **Checkout** — customer information, shipping address and order summary.
6. **Midtrans Payment** — actual Midtrans Snap interface and available payment methods.
7. **Payment Result** — actual result/status page reflecting the server-confirmed transaction state.

The seventh stage may show success, pending or failure as appropriate to the captured test transaction. Do not present mockups as real payment evidence.

## 4. Non-functional requirements

| ID | Requirement | Acceptance direction |
|---|---|---|
| NF-01 | Responsive layout | Supports mobile, tablet and desktop. |
| NF-02 | Performance | Optimized images and bounded data fetching. |
| NF-03 | Security | RLS, server-side validation and server-only secrets. |
| NF-04 | Reliability | Notification retries do not duplicate financial or order effects. |
| NF-05 | Consistency | Persisted order totals agree with server-calculated line items and shipping. |
| NF-06 | Error handling | Loading, empty, invalid and backend-error states are explicit. |
| NF-07 | Auditability | Payment notification and status transitions are traceable. |
| NF-08 | Maintainability | UI, data access, order logic and payment integration have clear boundaries. |

## 5. Business and security constraints

- No mandatory customer login or registration.
- No admin dashboard in this scope.
- Product data must come from Supabase; do not mask API failures with static/demo product catalogs.
- Backend is authoritative for prices, stock checks, shipping and payment status.
- Customer-facing browser redirects are not proof of payment.
- Midtrans server credentials must never be exposed to the browser or committed to the repository.
- Existing database schema and deployed function contracts must be audited before migrations or API changes.
- Existing records and integrations must not be removed or replaced without a separately approved migration plan.

## 6. Out of scope

- Supabase schema/data/RLS/grant changes and migration execution.
- Edge Function deployment or secret changes.
- Midtrans merchant dashboard/configuration changes.
- Real payment transactions.
- Production deployment, merge to main, or branch-protection changes.
- Admin dashboard and mandatory authentication.

## 7. Dependencies and open verification

- Audit the target repository's actual frontend, package scripts, Supabase migrations, deployed Edge Functions and environment-variable names before implementation.
- Confirm actual Midtrans merchant activation and enabled payment methods from the merchant account; do not infer them from this blueprint.
- Confirm the existing product schema and product response contract before finalizing database or API types.
- Confirm stock reservation, expiry and late-payment recovery behavior against the current implementation and business policy before coding.
