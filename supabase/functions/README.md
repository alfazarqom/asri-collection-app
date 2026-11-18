# Supabase Edge Functions — Asri Collection v1.0.0

This document distinguishes the canonical function source in this repository from functions observed in the remote Supabase project. A local directory/config entry does not mean that a function has been deployed.

## Canonical local function slugs

The frontend in `src/lib/api.ts` invokes these exact slugs. The same names are declared in `supabase/config.toml` and used by the local function directories.

| Function | Public entry | Server responsibility |
|---|---|---|
| `asri-get-products` | Catalog request | Return active, published catalog records only. |
| `asri-create-order` | Guest checkout | Validate customer/items, reserve stock atomically, calculate IDR totals, and save order/item snapshots. |
| `asri-create-midtrans-payment` | Order lookup token | Create or reuse a Snap redirect for the persisted order. |
| `asri-midtrans-notification` | Provider webhook | Verify notification signature and order/amount binding, then apply an idempotent status transition. |
| `asri-get-order-status` | Order lookup token | Return minimal order status and reconcile pending payment through Midtrans status verification. |

## Security model in local source

- The five functions use `verify_jwt = false` in `supabase/config.toml`. This is not an authorization control.
- Handlers validate HTTP methods and request payloads. Shared code applies body-size checks, CORS and server-side rate limiting.
- Rate-limit keys and order lookup tokens are hashed; raw lookup tokens are returned only at order creation.
- Client-supplied prices, totals, stock, payment status and provider IDs are not authoritative.
- Order creation and stock reservation run through a database RPC transaction. The local migration defines a 24-hour reservation expiry and a release routine.
- Midtrans callback signature verification uses `SHA512(order_id + status_code + gross_amount + ServerKey)`; expected order and amount are compared with the stored transaction.
- Duplicate and stale/out-of-order events are guarded by database logic. Late payment after stock release is marked as an order problem for manual resolution.
- Service-role and Midtrans server keys are server-only and must never be exposed via `VITE_*` or committed.

## Environment variables

Server-side only (Supabase Edge Function secrets or local uncommitted environment):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MIDTRANS_SERVER_KEY`
- `MIDTRANS_IS_PRODUCTION=false` for sandbox
- `APP_ORIGIN`
- `APP_PUBLIC_URL`

Frontend public configuration:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

The current integration uses a hosted Snap redirect. Do not add a server key to frontend configuration.

## Database RPC dependencies

- `asri_consume_api_rate_limit`
- `asri_create_order_atomic`
- `asri_release_expired_order_reservations`
- `asri_apply_midtrans_notification`

These are defined by the repository migration and are intended for service-role execution only.

## Remote status — read-only inspection on 2026-11-19

Two Supabase projects were visible to the connected account:
- `mvwflakurihhakdrlteg`: active.
- `cufvnzqseawjbyangdqg`: inactive; migration history was not available for inspection.

On the active `mvw...` project:
- Migration history contains version `20261118205854`, name `initial_asri_schema`.
- Asri-prefixed database tables are present.
- The deployed function list includes `get-asri-products`, `create-order`, `create-midtrans-payment`, `midtrans-notification` and `get-order-status` (unprefixed legacy slugs except the product function). The list does not show all five canonical `asri-*` slugs.

The repository does not identify which project ref is the authoritative target. The active project's migration version also differs from the local file version `20261119000100`. Therefore:
- It is verified that an Asri migration record and Asri tables exist on `mvw...`.
- It is **not verified** that `mvw...` is the approved target for this repository.
- It is **not verified** that the remote migration is identical to the current local SQL file.
- It is **not verified** that the five canonical local Edge Function slugs are deployed to the approved target.

Do not state that the repository migration has been applied to the approved Supabase project until project identity and migration/schema equivalence are confirmed.

## Deployment boundary

No database migration, secret configuration, Edge Function deployment, webhook change, payment transaction or production traffic switch was performed during this documentation update. Deploy the canonical prefixed slugs only after the target project, existing consumers and webhook configuration are confirmed and deployment is separately authorized.

Keep unrelated Divoom tables/functions/data and other payment-provider integrations outside the Asri namespace.
