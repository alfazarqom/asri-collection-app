# Supabase Edge Functions

These are planned function contracts for Asri Collection v1.0.0. This scaffold
does not contain deployed functions.

| Function | Access | Responsibility |
|---|---|---|
| get-asri-products | Public | Return active/published catalog fields only. |
| create-order | Public guest checkout | Validate input, reload prices and stock, calculate totals server-side, persist order and item snapshots. |
| create-midtrans-payment | Public guest checkout with protected order lookup | Create a Snap transaction for a valid persisted order. |
| midtrans-notification | Public provider webhook | Verify Midtrans notification, validate order and amount, process idempotently. |
| get-order-status | Public with unguessable order lookup credential | Return minimal status data without customer PII. |

## Security requirements

- Public functions must validate payloads, enforce size limits, and use abuse/rate
  controls before production.
- verify_jwt = false is configured because catalog and guest checkout/webhook
  requests cannot rely on a customer Supabase session. This does NOT make these
  endpoints safe without application-level validation.
- Never trust client prices, totals, stock, payment statuses, or provider IDs.
- Notification processing must use the official Midtrans verification procedure,
  compare expected order and amount, and be idempotent.
- Store a hash of the order lookup secret, not the raw secret.
- Never expose service-role or Midtrans server credentials to the browser.
- Do not log payment secrets or unnecessary customer personal information.

## Environment variables

Server-side secrets are configured outside Git, in the Supabase project or local
.env (never committed):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MIDTRANS_SERVER_KEY
- MIDTRANS_IS_PRODUCTION (false for sandbox)

Frontend-only public configuration may use:
- VITE_SUPABASE_URL
- VITE_SUPABASE_PUBLISHABLE_KEY
- VITE_MIDTRANS_CLIENT_KEY

## Implementation status

The local CLI configuration, initial SQL schema draft, and function contracts are
present. Function handlers, Midtrans signature verification, rate limiting, order
lookup flow, and automated integration tests remain to be implemented and
verified before activation.
