-- Asri Collection v1.0.0 — initial local schema
-- IMPORTANT:
-- This migration is repository source only; it has NOT been applied to any project.
-- Review against the target database before applying to avoid duplicate/conflicting objects.
-- No seed/demo products are inserted.
-- Payment state is server-owned. Browser clients receive no direct write policies.

begin;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.products (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  sku text unique,
  name text not null,
  description text,
  price_idr bigint not null check (price_idr >= 0),
  compare_at_price_idr bigint check (compare_at_price_idr is null or compare_at_price_idr >= price_idr),
  currency text not null default 'IDR' check (currency = 'IDR'),
  images jsonb not null default '[]'::jsonb check (jsonb_typeof(images) = 'array'),
  options jsonb not null default '[]'::jsonb check (jsonb_typeof(options) = 'array'),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_active_published_idx
  on public.products (is_active, published_at desc) where is_active = true;

create table if not exists public.orders (
  id uuid primary key default extensions.gen_random_uuid(),
  order_number text not null unique,
  lookup_token_hash text not null,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null check (jsonb_typeof(shipping_address) = 'object'),
  currency text not null default 'IDR' check (currency = 'IDR'),
  subtotal_idr bigint not null check (subtotal_idr >= 0),
  shipping_cost_idr bigint not null default 52000 check (shipping_cost_idr >= 0),
  total_idr bigint not null check (total_idr = subtotal_idr + shipping_cost_idr),
  order_status text not null default 'pending'
    check (order_status in ('pending', 'processing', 'completed', 'cancelled', 'problem')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'success', 'failed', 'expired', 'cancelled', 'refund', 'problem')),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);

create table if not exists public.order_items (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  product_sku text,
  selected_options jsonb not null default '{}'::jsonb check (jsonb_typeof(selected_options) = 'object'),
  unit_price_idr bigint not null check (unit_price_idr >= 0),
  quantity integer not null check (quantity > 0),
  line_total_idr bigint generated always as (unit_price_idr * quantity) stored,
  created_at timestamptz not null default now()
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.payment_transactions (
  id uuid primary key default extensions.gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  provider text not null default 'midtrans' check (provider = 'midtrans'),
  provider_order_id text not null unique,
  provider_transaction_id text unique,
  gross_amount_idr bigint not null check (gross_amount_idr >= 0),
  payment_type text,
  transaction_status text,
  fraud_status text,
  internal_status text not null default 'pending'
    check (internal_status in ('pending', 'success', 'failed', 'expired', 'cancelled', 'refund', 'problem')),
  snap_token text,
  snap_redirect_url text,
  raw_response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payment_transactions_order_id_idx on public.payment_transactions (order_id);

create table if not exists public.payment_callback_events (
  id uuid primary key default extensions.gen_random_uuid(),
  provider text not null default 'midtrans' check (provider = 'midtrans'),
  provider_event_key text not null unique,
  provider_order_id text,
  provider_transaction_id text,
  signature_valid boolean not null default false,
  processing_status text not null default 'received'
    check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  payload jsonb not null default '{}'::jsonb,
  processing_error text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

create index if not exists payment_callback_events_received_at_idx
  on public.payment_callback_events (received_at desc);

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_callback_events enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active = true and published_at is not null and published_at <= now());

-- No client write policies are created for any table.
-- Privileged writes belong in validated server-side Edge Functions.

commit;
