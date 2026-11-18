# Supabase & Midtrans Architecture — Asri Collection v1.0.0

**Status:** Architecture aligned with the current repository source. Remote project identity and deployed function parity remain unverified.

## 1. Current application architecture

- Frontend: React 18 + TypeScript + Vite 6 + Tailwind CSS v4.
- Backend: Supabase PostgreSQL, Storage and Edge Functions.
- Payment: Midtrans Snap hosted redirect.
- Checkout: guest checkout; no mandatory customer account.
- Currency: IDR; shipping is flat Rp52.000.
- The browser invokes controlled application services; privileged order/payment operations run in Edge Functions.

### Current React Router paths

These are the routes implemented in `src/App.tsx`:

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/products` | Product catalog |
| `/products/:slug` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Guest checkout |
| `/payment/:orderNumber` | Order summary and Midtrans payment handoff |
| `/payment/result?order=:orderNumber` | Payment return/result; reads the order number from the query string |
| `/order` | Order tracking; order number and lookup token are submitted through the page flow |

The router's base path is configured using Vite's `import.meta.env.BASE_URL`.

## 2. Data model

The current repository migration defines these Asri tables:

| Table | Responsibility |
|---|---|
| `asri_products` | Product catalog, publication state, price, options and stock. |
| `asri_orders` | Order number, lookup-token hash, customer/address, totals and order/payment lifecycle. |
| `asri_order_items` | Immutable product, selected-option, quantity and unit-price snapshots. |
| `asri_payment_transactions` | Midtrans transaction reference, amount, payment type and normalized status. |
| `asri_payment_callback_events` | Notification audit, verification outcome and idempotency reference. |
| `asri_api_rate_limits` | Hashed-key rate-limit windows and counters. |

The migration includes RLS, server-side RPCs, stock reservation/release and payment callback state handling. These are repository definitions; remote equivalence must be checked against the authoritative project before further schema work.

## 3. Canonical local Edge Functions

The frontend and local Supabase configuration use these exact slugs:

| Function | Responsibility |
|---|---|
| `asri-get-products` | Return active/published catalog records. |
| `asri-create-order` | Validate customer data, product IDs/options, prices and stock; calculate shipping/total; persist order and item snapshots. |
| `asri-create-midtrans-payment` | Create/reuse a Snap transaction for a valid persisted order. |
| `asri-midtrans-notification` | Verify provider notification, bind it to order/amount, record event idempotently and update state. |
| `asri-get-order-status` | Return permitted order/status data and reconcile pending payment. |

The remote active project inspected on 2026-11-19 still lists legacy/unprefixed payment function slugs. Do not assume the local canonical slugs are deployed until the correct project and runtime functions are verified.

## 4. Order and payment lifecycle

1. Customer submits guest checkout details and selected product options.
2. `asri-create-order` reloads authoritative product data and validates stock/availability.
3. Backend calculates subtotal, flat shipping Rp52.000 and grand total.
4. Backend persists order and immutable item snapshots and returns an order lookup token once.
5. `asri-create-midtrans-payment` creates or reuses the Snap transaction using server-only credentials.
6. Frontend redirects the customer to the hosted Snap payment URL.
7. Midtrans sends a server notification to `asri-midtrans-notification`.
8. Backend verifies signature, order identity and amount against the stored transaction.
9. Backend records the callback event and applies an idempotent state transition.
10. Payment result and tracking pages read backend-confirmed order status through `asri-get-order-status`.

A browser return is a navigation event, never payment proof. If notification delivery is delayed, show a pending/rechecking state and use trusted server-side status verification.

## 5. Payment status model

The local schema supports normalized states including:
- `pending`
- `success`
- `failed`
- `expired`
- `cancelled`
- `refund`
- `problem`

Map actual Midtrans transaction/fraud statuses using provider semantics. Duplicate and out-of-order notifications must not regress a terminal state.

## 6. RLS and access boundaries

- Public clients may read only published/active catalog data.
- Public clients must not directly write payment state, callback events, trusted order totals or privileged order fields.
- Customer order lookup must not expose other customers' personal information; use the unguessable lookup token flow.
- Privileged service-role access is restricted to server-side functions.
- Enable and test RLS on exposed tables; verify grants and policies against the authoritative remote schema before changes.

## 7. Storage

The blueprint's intended buckets are `product-images`, `banners` and `private-documents`. Their actual remote existence and policies have not been verified as part of this documentation pass. Inspect existing buckets before creating or changing any.

## 8. Environment configuration

Frontend public configuration:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Server-side placeholders:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
MIDTRANS_SERVER_KEY=
MIDTRANS_IS_PRODUCTION=false
APP_ORIGIN=
APP_PUBLIC_URL=
```

Never expose service-role or Midtrans server credentials through `VITE_*`, source code, logs or committed environment files.

## 9. Remote migration status and change boundary

Read-only inspection on 2026-11-19 found an `initial_asri_schema` migration record (version `20261118205854`) and Asri tables on active project `mvwflakurihhakdrlteg`. Another visible project `cufvnzqseawjbyangdqg` was inactive and could not be inspected. The repository does not declare the authoritative project ref, and the remote migration version differs from the local migration file version `20261119000100`.

Consequently, the approved target's migration status and equivalence to the local SQL remain unverified. No SQL migration execution, schema/data/RLS/grant mutation, Edge Function deployment, secret configuration, merchant dashboard change, sandbox/production payment or deployment is authorized or performed by this document update.
