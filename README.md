# Asri Collection

Responsive storefront for **Asri Collection — Tampil Elegan, Setiap Hari**.

## Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- Supabase PostgreSQL and Edge Functions
- Midtrans Snap hosted redirect (IDR)

## Local frontend

1. Install Node.js 22 or later.
2. Copy `.env.example` to `.env.local`.
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
4. Install dependencies and run the app:

```sh
npm install
npm run dev
```

Build and checks:

```sh
npm run typecheck
npm test
npm run build
```

The storefront intentionally has no demo/static product fallback. The catalog shows a configuration/error/empty state when the Supabase-backed product function is unavailable.

## Supabase local development

- CLI configuration: `supabase/config.toml`
- Migration: `supabase/migrations/20261119000100_initial_asri_schema.sql`
- Edge Function handlers: `supabase/functions/`
- Server-only placeholders: `supabase/.env.example`

Review the migration against the target database before running it. The migration includes preflight guards and is source code only; it has not been applied to a Supabase project.

## Seven merchant evidence stages

1. Homepage
2. Product Catalog
3. Product Detail
4. Shopping Cart
5. Checkout
6. Midtrans Payment
7. Payment Result

Capture evidence from the running application and a configured Midtrans sandbox. Do not present a static mockup as an actual payment transaction.

## Security and scope

- Guest checkout; no mandatory customer authentication.
- Backend recalculates product totals and shipping (flat Rp52.000).
- Order lookup requires a secret token; only its hash is stored.
- Midtrans payment status is updated by verified server notification or verified server-side status reconciliation, never by browser redirect parameters.
- Service-role and Midtrans server keys must remain server-side.
- No admin dashboard, database deployment, secrets configuration, merchant dashboard changes or production deployment are included.

See `docs/` and `supabase/functions/README.md` for architecture and contracts.
