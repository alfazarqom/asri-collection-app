# Testing Plan — Asri Collection v1.0.0

## 1. Frontend flow

| Test ID | Scenario | Expected result |
|---|---|---|
| T-01 | Open homepage | Storefront renders without runtime error. |
| T-02 | Load catalog | Supabase-backed active products render. |
| T-03 | Product API returns empty | Clear empty state; no demo fallback. |
| T-04 | Product API fails | Clear recoverable error state. |
| T-05 | Open product detail | Correct product and option information render. |
| T-06 | Add/update/remove cart item | Cart contents and quantities update correctly. |
| T-07 | Submit incomplete checkout | Validation blocks submission and identifies missing fields. |

## 2. Backend and payment

| Test ID | Scenario | Expected result |
|---|---|---|
| T-08 | Create order with valid products | Server-calculated order and item snapshots are persisted. |
| T-09 | Submit tampered price/total | Client amount is ignored; server calculation prevails. |
| T-10 | Product unavailable/stock insufficient | Order creation is rejected safely. |
| T-11 | Create Midtrans transaction | Snap token/provider reference is persisted for the correct order. |
| T-12 | Valid notification | Signature/verification, order and amount checks pass; status is updated. |
| T-13 | Invalid notification | No payment/order success transition occurs. |
| T-14 | Duplicate notification | Idempotent processing; no duplicate side effects. |
| T-15 | Out-of-order notification | State transition rules prevent invalid regression. |
| T-16 | Pending transaction | Result UI remains pending until trusted confirmation. |
| T-17 | Expired/failed/refund transaction | Correct normalized status is shown after verified processing. |
| T-18 | Unauthorized public write | RLS/authorization denies privileged mutation. |
| T-19 | Order lookup for another customer | Personal/order data is not disclosed. |

## 3. Merchant evidence

Capture the seven required screens only after the corresponding UI is implemented and working. The Midtrans screen must be the real Snap interface in the configured test/merchant environment. Payment Result must reflect the verified backend state.

## 4. Verification report format

For each command or test, report one of:

- PASS — output/evidence proves success.
- FAIL — test ran and exposed a failure.
- NOT RUN — not executed.
- BLOCKED — could not run due to missing environment, credentials or access.

Record the exact command, short output summary, environment (local/sandbox), and unresolved issue. Never claim tests passed without execution evidence.

## 5. Not executed by this blueprint commit

No application tests, SQL migrations, Supabase function tests, Midtrans sandbox transactions, or deployment checks are claimed as executed by adding these documentation files.
