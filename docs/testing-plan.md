# Testing Plan — Asri Collection v1.0.0

This plan follows the current source tree and route contract. A listed test is not a claim that it has already passed.

## 1. Frontend routes and flow

| Test ID | Scenario | Expected result |
|---|---|---|
| T-01 | Open `/` | Storefront homepage renders without runtime error. |
| T-02 | Open `/products` | Supabase-backed active products render. |
| T-03 | Product API returns empty | Clear empty state; no demo fallback. |
| T-04 | Product API fails | Clear recoverable error state. |
| T-05 | Open `/products/:slug` | Correct product and option information render. |
| T-06 | Add/update/remove cart item | Cart contents and quantities update correctly and persist in local storage. |
| T-07 | Submit incomplete `/checkout` form | Validation blocks submission and identifies missing fields. |
| T-08 | Open `/payment/:orderNumber` | Correct order summary and payment handoff are shown for the session lookup token. |
| T-09 | Return to `/payment/result?order=:orderNumber` | Result page retrieves status from backend; redirect query alone cannot mark payment successful. |
| T-10 | Open `/order` and submit lookup details | Only permitted order status is returned for a valid lookup token. |
| T-11 | Open unknown route | Not-found state is rendered. |
| T-12 | Build under GitHub Pages base path | In-app links remain under `/asri-collection-app/`. |

## 2. Backend and payment

| Test ID | Scenario | Expected result |
|---|---|---|
| T-13 | Invoke `asri-get-products` | Published/active catalog response matches the frontend product contract. |
| T-14 | Create order with valid products | Server-calculated order and item snapshots are persisted. |
| T-15 | Submit tampered price/total | Client amount is ignored; server calculation prevails. |
| T-16 | Product unavailable/stock insufficient | Order creation is rejected safely. |
| T-17 | Create Midtrans transaction | Snap redirect URL/provider reference is persisted for the correct order. |
| T-18 | Valid notification | Signature/verification, order and amount checks pass; status is updated. |
| T-19 | Invalid notification | No payment/order success transition occurs. |
| T-20 | Duplicate notification | Idempotent processing; no duplicate side effects. |
| T-21 | Out-of-order notification | State transition rules prevent invalid regression. |
| T-22 | Pending transaction | Result UI remains pending until trusted confirmation. |
| T-23 | Expired/failed/refund transaction | Correct normalized status is shown after verified processing. |
| T-24 | Unauthorized public write | RLS/authorization denies privileged mutation. |
| T-25 | Lookup token for another customer | Personal/order data is not disclosed. |

## 3. Local command checks

Defined by `package.json`:

```sh
npm run typecheck
npm test
npm run build
```

Current local Edge Function source directories use the prefixed names:

```sh
deno check supabase/functions/asri-get-products/index.ts
deno check supabase/functions/asri-create-order/index.ts
deno check supabase/functions/asri-create-midtrans-payment/index.ts
deno check supabase/functions/asri-midtrans-notification/index.ts
deno check supabase/functions/asri-get-order-status/index.ts
```

**CI discrepancy:** `.github/workflows/ci.yml` currently invokes Deno checks against legacy unprefixed paths (`get-asri-products`, `create-order`, `create-midtrans-payment`, `midtrans-notification`, `get-order-status`). Those paths do not match the current prefixed local function directories. The workflow must be corrected separately; until then, do not treat its Edge Function check as validating the current source tree.

The workflow also includes a clean local Supabase migration reset. This validates migration execution against an isolated local database, not against the hosted target project.

## 4. Database and remote verification

- Review the migration preflight against the actual authoritative project before applying schema changes.
- Confirm migration history and schema equivalence; a similarly named remote migration with a different version is not proof that the current local SQL file was applied.
- Verify RLS, grants, RPC execution permissions and storage policies against the target.
- Do not execute migrations or mutate the remote database as part of this test plan.

Read-only observation on 2026-11-19 found an `initial_asri_schema` migration record on active project `mvwflakurihhakdrlteg`, but the authoritative project ref for this repository remains unconfirmed. A second visible project `cufvnzqseawjbyangdqg` was inactive and its migration history was unavailable.

## 5. Midtrans sandbox and merchant evidence

Capture the seven required stages only after the corresponding UI is implemented and working:

1. Homepage
2. Product Catalog
3. Product Detail
4. Shopping Cart
5. Checkout
6. Midtrans Snap payment interface and available payment methods
7. Payment Result reflecting backend-confirmed state

Use an explicitly configured sandbox environment. Clearly label sandbox/test evidence; never fabricate a successful payment screenshot.

## 6. Verification report format

For each command or test, report one of:

- **PASS** — output/evidence proves success.
- **FAIL** — test ran and exposed a failure.
- **NOT RUN** — not executed.
- **BLOCKED** — could not run due to missing environment, credentials or access.

Record the exact command, short output summary, environment (local/sandbox), and unresolved issue. Never claim tests passed without execution evidence.

## 7. Not performed by this documentation update

No application test, CI workflow edit, SQL migration execution, Supabase function deployment, secret change, Midtrans sandbox transaction, merchant configuration change or production deployment was performed by updating this plan.
