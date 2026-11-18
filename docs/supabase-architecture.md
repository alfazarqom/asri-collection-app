# Supabase & Midtrans Architecture — Asri Collection v1.0.0

**Status:** Approved architectural baseline; implementation details require repository and Supabase audit.

## 1. Architecture

- Frontend: React + TypeScript + Vite.
- Backend: Supabase PostgreSQL, Storage and Edge Functions.
- Payment: Midtrans Snap.
- The browser calls controlled application services; privileged order/payment operations run in Edge Functions.
- Supabase schema, deployed functions and current frontend contracts must be inspected before any migration or replacement.

## 2. Conceptual data model

The following are conceptual responsibilities, not a claim that these exact columns or tables already exist.

| Table | Responsibility |
|---|---|
| `divoom_products` | Product catalog and product availability. |
| `divoom_orders` | Order number, customer contact/address, totals and order/payment lifecycle. |
| `divoom_order_items` | Immutable product name, selected option, quantity and unit-price snapshots. |
| `divoom_payment_transactions` | Midtrans transaction reference, amount, payment type and normalized status. |
| `divoom_payment_callback_events` | Notification event audit, verification outcome, processing state and idempotency reference. |

Use existing category/variant structures if they are present and verified. Do not create parallel tables such as a second payments table or a speculative inventory-reservations subsystem without an audit and explicit requirement.

### Required integrity principles

- Persist an order and item snapshots before creating the payment transaction.
- Calculate amounts on the server from trusted product records.
- Store currency and amount consistently; use an exact numeric/integer representation suitable for IDR, never floating-point arithmetic for money.
- Bind each Midtrans transaction to one internal order and expected amount.
- Enforce unique constraints or equivalent idempotency controls for provider transaction/event identifiers where appropriate.
- Define allowed order/payment state transitions and prevent stale or out-of-order events from regressing a terminal state.
- Define stock reservation, release, expiry and late-payment recovery only after the existing stock model and business policy are confirmed.

## 3. Edge Function responsibilities

| Function | Responsibility |
|---|---|
| `get-asri-divoom_products` | Return the verified public product catalog contract. |
| `create-order` | Validate customer input, product IDs/options, current prices and stock; calculate shipping and total; persist order and item snapshots. |
| `create-midtrans-payment` | Create a Midtrans Snap transaction for an existing valid order and persist provider references. |
| `midtrans-notification` | Verify Midtrans notification server-side, bind it to the order and amount, record the event idempotently and update payment/order state. |
| `get-order-status` | Return only the permitted order/status information for a valid lookup credential or protected order reference. |

These are target responsibilities. Before implementation, compare them with deployed function names and contracts to avoid duplicate endpoints. Existing `get-asri-divoom_products` should be inspected rather than replaced on assumption.

## 4. Payment lifecycle

1. Customer submits checkout details.
2. `create-order` reloads authoritative product data and validates stock/availability.
3. Backend calculates subtotal, flat shipping Rp52.000 and grand total.
4. Backend persists order and immutable order-item snapshots.
5. `create-midtrans-payment` creates the Snap transaction using server-only credentials.
6. Frontend opens the Snap payment interface using only the appropriate client-side configuration/token.
7. Midtrans sends a server notification to `midtrans-notification`.
8. Backend verifies the notification using the official Midtrans verification procedure and checks order identity, amount and transaction consistency.
9. Backend records the event and applies an idempotent state transition.
10. Payment result UI reads the latest backend-confirmed status.

A browser return/redirect is a navigation event only, never payment proof. If notification delivery is delayed, show a pending/rechecking state and use a trusted server-side status verification/reconciliation path.

## 5. Status normalization

The internal status model may include:

- `pending`
- `success`
- `failed`
- `expired`
- `cancelled`
- `refund`
- `problem`

Map actual Midtrans transaction and fraud statuses to these internal states using official provider semantics. Do not assume every provider status maps one-to-one. Define precedence for duplicate and out-of-order notifications before implementation.

## 6. RLS and access boundaries

- Public clients may read only published/active catalog data.
- Public clients must not directly write payment state, callback events, trusted order totals or privileged order fields.
- Customer order lookup must not expose other customers' personal information; use an appropriate unguessable/protected lookup mechanism.
- Administrative product writes require an authorized server-side/admin path.
- Privileged service-role access is restricted to server-side functions and must never be included in frontend bundles.
- Enable and test RLS on exposed tables; document grants and policies after inspecting the actual schema.

## 7. Storage

| Bucket | Intended access |
|---|---|
| `product-images` | Public read; controlled upload/write. |
| `banners` | Public read; controlled upload/write. |
| `private-documents` | Private; authenticated/authorized access only. |

Verify existing bucket names and policies before creating or changing any bucket.

## 8. Environment configuration

Frontend may contain only public configuration, for example:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_MIDTRANS_CLIENT_KEY=
```

Server-side environment names are placeholders to be aligned with the existing deployment:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
```

Never expose service-role or Midtrans server credentials through `VITE_*`, source code, logs, documentation values or committed environment files. Use placeholders only.

## 9. Required security tests

- Tampered client total is ignored.
- Unknown, inactive or unavailable divoom_products are rejected.
- Invalid order/amount/provider transaction binding is rejected.
- Invalid Midtrans notification verification does not change payment/order state.
- Duplicate notification has no duplicate side effect.
- Out-of-order notification cannot regress a terminal state.
- Public client cannot write privileged order/payment/callback fields.
- Customer lookup cannot enumerate or read another customer's personal data.

## 10. Explicitly not authorized by this document

No SQL migration execution, schema/data/RLS/grant mutation, Edge Function deployment, secret configuration, merchant dashboard change, sandbox/production payment, or deployment is authorized by this architecture document.
