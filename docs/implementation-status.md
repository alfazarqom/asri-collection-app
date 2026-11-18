# Implementation Status — Asri Collection v1.0.0

**Observed branch:** `main`  
**Baseline:** Asri Collection v1.0.0  
**Scope:** Repository implementation and read-only Supabase inspection. No database, secret, merchant, function deployment, payment, or production changes were performed.

## A-01 — Frontend

Implemented in the current repository:
- React 18 + TypeScript + Vite 6 with Tailwind CSS v4.
- Responsive storefront shell with homepage, catalog, product detail, cart, guest checkout, Midtrans payment handoff, payment result and order tracking.
- Product catalog is loaded through `asri-get-products`; there is no local/demo product fallback.
- Product options are carried through cart and submitted to the backend.
- Cart persists in browser local storage.
- Guest checkout collects name, email, phone, address, city, province and postal code.
- Order lookup credentials are retained in the browser session; the lookup token is not placed in the URL.
- Loading, empty, error and unavailable-product states are rendered.
- React Router routes are documented in `docs/blueprint.json` and `docs/supabase-architecture.md`.

## A-02 — Local Supabase Edge Functions

The repository contains five prefixed function directories and the frontend invokes these exact slugs:

- `asri-get-products`
- `asri-create-order`
- `asri-create-midtrans-payment`
- `asri-midtrans-notification`
- `asri-get-order-status`

The same slugs are declared in `supabase/config.toml`. Local source uses shared request validation, CORS, rate limiting and service-role access.

## A-03 — Checkout and Midtrans implementation

Implemented in local source:
- `verify_jwt = false` is configured for the five public/application endpoints; handlers enforce method, payload, order-token and request validation.
- Backend recalculates product prices, availability, shipping and order totals. Client totals are not trusted.
- A random order lookup token is returned to the customer; only its SHA-256 hash is stored.
- Midtrans notification signature verification uses SHA-512 over `order_id + status_code + gross_amount + ServerKey`.
- Callback order identity and amount are checked against the persisted transaction.
- Callback event keys and database RPCs provide duplicate-event handling and guarded state transitions.
- Pending payment can be reconciled through Midtrans status verification.
- Browser return/redirect is not treated as proof of payment.
- Late success after stock release is represented as an order problem for manual resolution.

These are source-code claims; they do not establish that the same handlers are deployed or correctly configured in the remote project.

## A-04 — Database migration and remote verification

Repository migration:
- File: `supabase/migrations/20261119000100_initial_asri_schema.sql`
- The file contains the initial Asri schema, preflight guards, RLS, RPCs, stock reservation and payment callback logic.
- The local file's header says it has not been applied to a Supabase project.

Read-only remote observations on 2026-11-19:
- Supabase project `mvwflakurihhakdrlteg` is active and its migration history contains `20261118205854_initial_asri_schema`; Asri tables are also present.
- That remote migration version differs from this repository file's version `20261119000100`. The history entry does not prove byte-for-byte identity with the current repository migration.
- A second project, `cufvnzqseawjbyangdqg`, is listed as inactive; its migration history could not be inspected.
- The repository does not identify either project ref as its authoritative/approved target.

**Conclusion:** An Asri schema migration is recorded on the active `mvw...` project, but whether that is the approved target for this repository and whether it is equivalent to the current local migration remain **UNVERIFIED**. Do not claim that the exact repository migration has been applied to the approved target until the project identity and migration contents are reconciled.

## Remote Edge Function deployment observation

The active `mvw...` project's function list currently includes legacy/unprefixed Asri payment slugs (`create-order`, `create-midtrans-payment`, `midtrans-notification`, `get-order-status`) and `get-asri-products`. It does not currently show all five local canonical `asri-*` slugs.

Therefore, local function source/configuration and remote deployed function names are not yet aligned. No deployment or traffic switch was performed.

## CI and verification boundary

- Frontend workflow commands: `npm run typecheck`, `npm test`, `npm run build`.
- The current `.github/workflows/ci.yml` Edge Function step still points to legacy unprefixed source directories. It must be updated to check the five prefixed directories before CI can be treated as validating the current local function source.
- The workflow includes a clean local Supabase migration reset job; this is distinct from applying the migration to a hosted project.
- No claim is made here that current tests or CI have passed unless a corresponding run is separately inspected.
- No secrets, merchant settings, hosted database changes, Edge Function deployments, sandbox transactions, merges or production deployments were performed.

## Remaining operational prerequisites

1. Confirm the authoritative Supabase project ref for this repository.
2. Compare the remote migration history and schema against `20261119000100_initial_asri_schema.sql`; resolve any version/content drift before applying anything.
3. Align the deployed Edge Function slugs with the five canonical local slugs, after explicit deployment approval and consumer/webhook planning.
4. Update CI's Deno check paths to the current prefixed function directories.
5. Configure server secrets and Midtrans notification URL only after the target project and deployment plan are confirmed.
6. Run authorized sandbox tests for order creation, payment, notification retries, expiry and late-payment recovery.
