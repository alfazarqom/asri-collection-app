# Implementation Status — A-01 to A-04

**Target branch:** `feature/blueprint-v1`
**Baseline:** Asri Collection v1.0.0
**Scope:** Repository code only. No Supabase project was linked or modified.

## A-01 — Frontend

Implemented:
- React 18 + TypeScript + Vite with Tailwind CSS v4.
- Responsive storefront shell and seven merchant evidence stages: homepage, catalog, detail, cart, checkout, Midtrans hosted payment, and payment result.
- Product catalog loads from `get-asri-products`; no local/demo product fallback.
- Product option selection is carried into cart and sent to backend.
- Cart persists in browser local storage; checkout uses guest customer details.
- Protected order lookup code is shown after order creation and kept out of URL query strings.
- Explicit loading, empty, error and unavailable-product states.

## A-02 — Supabase Edge Functions

Implemented local handlers:
- `get-asri-products`
- `create-order`
- `create-midtrans-payment`
- `midtrans-notification`
- `get-order-status`

Shared code covers request size checks, input validation, CORS, service-role client creation, SHA-256 tokens and database-backed rate limits.

## A-03 — Public endpoint and Midtrans security

Implemented:
- `verify_jwt = false` remains for public catalog, guest checkout and webhook entry points; handler-level validation and service-role-only RPC permissions provide the application boundary.
- Client prices/totals are ignored. Order totals and product availability are read and calculated on the server.
- A random order lookup token is returned once; only its SHA-256 hash is stored.
- Midtrans notification signature uses SHA-512 over `order_id + status_code + gross_amount + ServerKey`.
- Callback order ID and amount are matched to the persisted payment transaction.
- Callback event key is unique; duplicate and stale/out-of-order state changes are ignored.
- Pending order status can be reconciled through Midtrans GET Status, with signature and amount verification.
- Browser return URL is not treated as payment proof.
- Late success after stock has been released is recorded as payment success with order status `problem` for manual resolution.

## A-04 — Database migration

The initial migration now includes:
- Preflight guards for existing table columns and critical column types. Incompatible existing tables cause an explicit exception rather than being silently accepted.
- Unique indexes for order lookup/order number, payment provider references, callback event keys and one payment transaction per order.
- Integer IDR amounts, generated order line totals, RLS and explicit public table privileges.
- `updated_at` triggers.
- Atomic `create_order_atomic` RPC with row locks, product availability/option checks, server-side pricing and stock reservation.
- 24-hour order reservation expiry and `release_expired_order_reservations` RPC.
- Idempotent `apply_midtrans_notification` RPC and server-only execution grants.
- `consume_api_rate_limit` RPC with hashed keys.

## Verification boundary

- Frontend unit tests and production build are configured in GitHub Actions.
- Deno type checks are configured for all five Edge Functions.
- The workflow result must be checked on the PR head commit before treating these checks as passed.
- SQL has not been executed against a local database or Supabase project.
- The migration has not been compared against the live target schema.
- No secrets, merchant settings, payment transactions, database changes, Edge Function deployments, merges or production deployments were performed.

## Remaining operational prerequisites

1. Review the migration against the actual target database and resolve any preflight conflict with a dedicated compatibility migration.
2. Configure `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `MIDTRANS_SERVER_KEY`, `MIDTRANS_IS_PRODUCTION`, `APP_ORIGIN` and `APP_PUBLIC_URL` in the target Edge Function environment.
3. Configure the Midtrans Payment Notification URL to the deployed `midtrans-notification` endpoint.
4. Apply the approved migration only after database review and separate authorization.
5. Run sandbox tests for order creation, payment, notification retries, expiry and late payment recovery.
