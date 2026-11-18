# Supabase Edge Functions — Asri Collection v1.0.0

The five local handlers are implemented in this repository. They are **not deployed** to any Supabase project.

| Function | Public entry | Server responsibility |
|---|---|---|
| `get-asri-products` | Yes | Return active, published catalog records only. |
| `create-order` | Guest checkout | Validate customer/items, reserve stock atomically, calculate IDR totals, save item snapshots and a 24-hour expiry. |
| `create-midtrans-payment` | Protected by order lookup token | Create/reuse a Snap redirect for the persisted order. |
| `midtrans-notification` | Provider webhook | Verify SHA-512 signature and amount/order binding, then apply idempotent status transition. |
| `get-order-status` | Protected by order lookup token | Return minimal order status and reconcile pending payment through Midtrans GET Status with signature verification. |

## Security model

- All five functions use `verify_jwt = false` because catalog and guest checkout/webhook calls do not require a customer Supabase session. This is not an authorization control.
- Each handler validates methods and request payloads. Shared code applies body-size checks, server-side rate limiting and CORS.
- Rate-limit keys are SHA-256 hashes; no raw IP is persisted in the rate-limit table.
- Order access uses a cryptographically random lookup token. Only its SHA-256 hash is stored in `orders.lookup_token_hash`.
- Client-supplied prices, totals, stock, payment status and provider IDs are never authoritative.
- Order creation and stock reservation run inside the database RPC transaction. Reservations expire after 24 hours and are released when a server endpoint runs the expiry routine.
- Midtrans callback signature is verified using `SHA512(order_id + status_code + gross_amount + ServerKey)`. The expected order and amount are compared with the stored transaction.
- Duplicate and stale/out-of-order events are handled by the database RPC. Late payment after stock release is marked as an order problem for manual resolution; it is not silently treated as fulfillable.
- The service-role key and Midtrans server key are server-only. They must never be exposed via `VITE_*` or committed.
- The browser redirect is navigation only; it is not proof of payment.

## Environment variables

Server-side only (Supabase Edge Function secrets or local uncommitted environment):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION=false` for sandbox
- `APP_ORIGIN` exact frontend origin in deployed environments
- `APP_PUBLIC_URL` public storefront origin used for Midtrans finish callback

Frontend public configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The Midtrans Snap hosted redirect is used, so the frontend does not need a server key or Snap.js client key.

## Database RPC dependencies

- `consume_api_rate_limit`
- `create_order_atomic`
- `release_expired_order_reservations`
- `apply_midtrans_notification`

These are defined by the repository migration and are granted to `service_role` only.

## Verification and deployment boundary

- CI checks the frontend build, unit tests and Deno type checks.
- SQL migration has not been run against a local or hosted database in this task.
- No Supabase project was linked, queried, modified or deployed.
- Configure Edge Function secrets and `APP_ORIGIN`/ `APP_PUBLIC_URL` separately before sandbox testing.
- Review the actual target database schema before applying the migration. Its preflight deliberately aborts if existing table columns do not match this baseline.
