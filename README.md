# Asri Collection

Responsive storefront for **Asri Collection — Tampil Elegan, Setiap Hari**.

The application supports guest shopping and checkout, a Supabase-backed product catalog, and Midtrans Snap hosted payment (IDR).

## Technology stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- React Router
- Supabase PostgreSQL and Edge Functions
- Midtrans Snap hosted redirect

## Run locally

**Requirements:** Node.js 22 or later.

1. Clone the repository and install dependencies.
2. Supabase browser configuration is hardcoded directly in `src/lib/supabase.ts`; no `.env` file or `VITE_` variables are required for the Supabase URL or publishable key.

   Current configuration:

   ```ts
   const SUPABASE_URL = "https://mvwflakurihhakdrlteg.supabase.co";
   const SUPABASE_PUBLISHABLE_KEY =
     "sb_publishable_nGBEVnx4ZFHEe-ne3SzeOw_y3Lpt4nd";
   ```

3. Start the development server:

   ```sh
   npm install
   npm run dev
   ```

Vite prints the local development URL in the terminal.

### Available checks

```sh
npm run typecheck
npm test
npm run build
```

## Application routes

| Route | Purpose |
|---|---|
| `/` | Homepage |
| `/products` | Product catalog |
| `/products/:slug` | Product detail |
| `/cart` | Shopping cart |
| `/checkout` | Guest checkout |
| `/payment/:orderNumber` | Order summary and Midtrans payment handoff |
| `/payment/result?order=:orderNumber` | Payment return and server-verified order status |
| `/order` | Order tracking using order number and access token |

The router uses Vite's `BASE_URL`. In the GitHub Pages Actions build, Vite sets the base path to `/asri-collection-app/`, so in-app navigation remains under:

`https://alfazarqom.github.io/asri-collection-app/`

## Product catalog and backend

The storefront retrieves products through the Supabase Edge Function `asri-get-products`. It does not use demo products or a local static catalog fallback. If backend configuration or the catalog endpoint is unavailable, the UI displays an error or empty state.

The frontend invokes these canonical Edge Function slugs:

| Function | Purpose |
|---|---|
| `asri-get-products` | Read active, published products |
| `asri-create-order` | Validate guest checkout and create an order |
| `asri-create-midtrans-payment` | Create or reuse the Midtrans Snap payment redirect |
| `asri-midtrans-notification` | Receive and verify Midtrans payment notifications |
| `asri-get-order-status` | Retrieve protected order status and reconcile pending payment |

The canonical slugs are also declared in `supabase/config.toml`. See [Supabase Edge Functions documentation](supabase/functions/README.md) for the handler responsibilities and security model.

## Supabase schema and migration status

- Local Supabase CLI configuration: `supabase/config.toml`
- Initial schema migration: `supabase/migrations/20261119000100_initial_asri_schema.sql`
- Browser Supabase URL and publishable key: hardcoded in `src/lib/supabase.ts`
- Server-side environment template: `supabase/.env.example`

**Important:** The migration file identifies itself as repository source that has **not** been applied to a Supabase project. The repository alone cannot confirm the current migration state of any remote Supabase project. Review the target database and migration history before applying it; do not treat the presence of the SQL file as proof of deployment.

## Checkout, shipping, and payment rules

- Customers can check out as guests; customer authentication is not required.
- The backend is authoritative for product availability, prices, order totals, and stock reservation.
- Shipping is a flat **Rp52.000**.
- Order lookup is protected by a random access token; only its hash is stored by the backend.
- Midtrans Snap is used as a hosted payment redirect.
- A browser redirect is not proof of payment. Payment status must come from a verified Midtrans notification or server-side status reconciliation.
- The Supabase publishable key is intended for browser use and is not a secret. Never expose a Supabase service-role/secret key or Midtrans server key in frontend source or commit them.

## Merchant evidence checklist

Capture genuine screenshots from the running application for these seven stages:

1. Homepage
2. Product Catalog
3. Product Detail
4. Shopping Cart
5. Checkout
6. Midtrans Payment
7. Payment Result

Use a configured Midtrans sandbox for payment evidence. Do not present a mockup or browser redirect alone as proof of a successful payment.

## Scope and operational boundaries

This repository documents and contains the storefront implementation and local backend source. The README does not imply that a Supabase migration, Edge Function deployment, secrets configuration, Midtrans merchant configuration, sandbox transaction, or production deployment has been performed. Verify each of those independently in its target environment before operational use.

There is no admin dashboard or mandatory customer login in this baseline.
