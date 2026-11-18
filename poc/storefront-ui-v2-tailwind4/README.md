# Storefront UI V2 + Tailwind CSS 4 POC

This directory is an isolated compatibility test. It is not imported by the Asri Collection application and does not change its production dependencies or application behavior.

## Test matrix

- React / React DOM: 18.3.1
- Vite: 6.3.5
- Tailwind CSS: 4.1.13
- Storefront UI React: 3.0.0
- Storefront UI typography: 3.1.0
- Storefront UI Tailwind preset: resolved through the React package's exported CSS entry

The selected Storefront UI React 3.0.0 source declares React `^18.3.1` as its peer dependency. Its Tailwind configuration package 3.0.0 declares Tailwind CSS 4 as a peer dependency.

## Why this version is pinned

Storefront UI React 4.0.3 declares React 19 as its peer dependency and therefore is not the candidate for the current Asri React 18 application. This POC deliberately tests the React 18-compatible package line while retaining Tailwind CSS 4.

## Run locally

From this directory:

```bash
npm install
npm run typecheck
npm run build
npm run dev
```

## Scope boundaries

- No changes to the root `package.json`, `src/`, existing Vite configuration or global styles.
- No Supabase credentials, client, API calls, Edge Functions or database access.
- No Midtrans/payment integration.
- No merge, deployment or production integration.
