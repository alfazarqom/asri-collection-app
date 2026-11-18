# Acceptance Criteria — Asri Collection v1.0.0

| ID | Stage/area | Acceptance criteria | Priority |
|---|---|---|---|
| AC-01 | Homepage | Brand identity, navigation and homepage content render correctly. | P0 |
| AC-02 | Catalog | Active products are loaded from the verified Supabase product API; loading, empty and error states are visible. | P0 |
| AC-03 | Product detail | Images, description, price and available options match the backend product record. | P0 |
| AC-04 | Cart | Add/remove/quantity operations work and displayed subtotal is internally consistent. | P0 |
| AC-05 | Checkout | Customer details and shipping address are validated; shipping is Rp52.000 under the approved flat-rate rule. | P0 |
| AC-06 | Order creation | Backend recalculates prices and totals and stores an order plus item snapshots. | P0 |
| AC-07 | Midtrans | A valid order can obtain a Snap transaction/token and display the merchant-enabled payment methods. | P0 |
| AC-08 | Notification | Valid Midtrans notifications are verified and linked to the expected order and amount. | P0 |
| AC-09 | Idempotency | Repeated notification delivery does not duplicate status transitions or other side effects. | P0 |
| AC-10 | Payment result | UI displays backend-confirmed pending/success/failure/expiry state, not an unverified redirect parameter. | P0 |
| AC-11 | Security | RLS and backend authorization prevent public writes to privileged order/payment data. | P0 |
| AC-12 | Order tracking | A customer can safely retrieve the permitted order status without exposing other customers' data. | P1 |
| AC-13 | Evidence | Seven actual application screenshots correspond to the seven merchant stages. | P0 |
| AC-14 | Responsive | Core flow is usable on mobile, tablet and desktop. | P0 |

## Merchant evidence checklist

1. Homepage screenshot.
2. Product Catalog screenshot.
3. Product Detail screenshot.
4. Shopping Cart screenshot.
5. Checkout screenshot.
6. Midtrans Snap payment-method screenshot.
7. Payment Result screenshot.

Evidence must be captured from the working application. Clearly distinguish a sandbox/test transaction from a live transaction. Do not fabricate a successful payment screenshot.
