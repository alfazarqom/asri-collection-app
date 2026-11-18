-- Asri Collection v1.0.0 — initial local schema and server-side invariants
-- Repository source only. This migration has NOT been applied to any Supabase project.
-- IMPORTANT: preflight guards intentionally abort if pre-existing tables do not match
-- this baseline. Audit the actual target schema and prepare a separate data migration first.
-- No demo products, secrets, merchant configuration, or payment transactions are inserted.

begin;

do $preflight$
declare
  v_missing integer;
begin
  if to_regclass('public.products') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='products'
      and column_name = any(array['id','slug','sku','name','description','price_idr','compare_at_price_idr','currency','images','options','stock_quantity','is_active','published_at','created_at','updated_at']);
    if v_missing <> 15 then
      raise exception 'Preflight blocked: public.products exists but does not match Asri baseline (15 required columns; found %). Audit and write a dedicated compatibility migration.', v_missing;
    end if;
  end if;
  if to_regclass('public.orders') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='orders'
      and column_name = any(array['id','order_number','lookup_token_hash','customer_name','customer_email','customer_phone','shipping_address','currency','subtotal_idr','shipping_cost_idr','total_idr','order_status','payment_status','expires_at','created_at','updated_at']);
    if v_missing <> 16 then
      raise exception 'Preflight blocked: public.orders exists but does not match Asri baseline (16 required columns; found %). Audit and write a dedicated compatibility migration.', v_missing;
    end if;
  end if;
  if to_regclass('public.order_items') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='order_items'
      and column_name = any(array['id','order_id','product_id','product_name','product_sku','selected_options','unit_price_idr','quantity','line_total_idr','created_at']);
    if v_missing <> 10 then
      raise exception 'Preflight blocked: public.order_items exists but does not match Asri baseline. Audit and write a dedicated compatibility migration.';
    end if;
  end if;
  if to_regclass('public.payment_transactions') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='payment_transactions'
      and column_name = any(array['id','order_id','provider','provider_order_id','provider_transaction_id','gross_amount_idr','payment_type','transaction_status','fraud_status','internal_status','snap_token','snap_redirect_url','raw_response','created_at','updated_at']);
    if v_missing <> 15 then
      raise exception 'Preflight blocked: public.payment_transactions exists but does not match Asri baseline. Audit and write a dedicated compatibility migration.';
    end if;
  end if;
  if to_regclass('public.payment_callback_events') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='payment_callback_events'
      and column_name = any(array['id','provider','provider_event_key','provider_order_id','provider_transaction_id','signature_valid','processing_status','payload','processing_error','received_at','processed_at']);
    if v_missing <> 11 then
      raise exception 'Preflight blocked: public.payment_callback_events exists but does not match Asri baseline. Audit and write a dedicated compatibility migration.';
    end if;
  end if;

  if to_regclass('public.api_rate_limits') is not null then
    select count(*) into v_missing from information_schema.columns
    where table_schema='public' and table_name='api_rate_limits'
      and column_name = any(array['key_hash','window_started_at','request_count']);
    if v_missing <> 3 then
      raise exception 'Preflight blocked: public.api_rate_limits exists with an incompatible structure.';
    end if;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='products'
      and ((column_name='id' and udt_name <> 'uuid')
        or (column_name='price_idr' and udt_name <> 'int8')
        or (column_name='stock_quantity' and udt_name <> 'int4')
        or (column_name in ('images','options') and udt_name <> 'jsonb')
        or (column_name='published_at' and udt_name <> 'timestamptz'))
  ) then
    raise exception 'Preflight blocked: public.products has incompatible column types.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='orders'
      and ((column_name='id' and udt_name <> 'uuid')
        or (column_name in ('subtotal_idr','shipping_cost_idr','total_idr') and udt_name <> 'int8')
        or (column_name='shipping_address' and udt_name <> 'jsonb'))
  ) then
    raise exception 'Preflight blocked: public.orders has incompatible column types.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='order_items'
      and ((column_name='id' and udt_name <> 'uuid')
        or (column_name in ('unit_price_idr','line_total_idr') and udt_name <> 'int8')
        or (column_name='quantity' and udt_name <> 'int4')
        or (column_name='selected_options' and udt_name <> 'jsonb'))
  ) then
    raise exception 'Preflight blocked: public.order_items has incompatible column types.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='payment_transactions'
      and ((column_name='id' and udt_name <> 'uuid')
        or (column_name='gross_amount_idr' and udt_name <> 'int8')
        or (column_name='raw_response' and udt_name <> 'jsonb'))
  ) then
    raise exception 'Preflight blocked: public.payment_transactions has incompatible column types.';
  end if;
  if exists (
    select 1 from information_schema.columns
    where table_schema='public' and table_name='payment_callback_events'
      and ((column_name='id' and udt_name <> 'uuid')
        or (column_name='payload' and udt_name <> 'jsonb'))
  ) then
    raise exception 'Preflight blocked: public.payment_callback_events has incompatible column types.';
  end if;
end
$preflight$;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
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
  stock_released boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_lookup_token_hash_unique unique (lookup_token_hash)
);
alter table public.orders add column if not exists stock_released boolean not null default false;

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists public.payment_transactions (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists public.payment_callback_events (
  id uuid primary key default gen_random_uuid(),
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

create table if not exists public.api_rate_limits (
  key_hash text primary key check (length(key_hash) = 64),
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0 check (request_count >= 0)
);

create unique index if not exists products_slug_uidx on public.products (slug);
create unique index if not exists products_sku_uidx on public.products (sku);
create unique index if not exists orders_order_number_uidx on public.orders (order_number);
create unique index if not exists orders_lookup_token_hash_uidx on public.orders (lookup_token_hash);
create unique index if not exists payment_transactions_provider_order_uidx on public.payment_transactions (provider_order_id);
create unique index if not exists payment_transactions_provider_tx_uidx on public.payment_transactions (provider_transaction_id);
create unique index if not exists payment_callback_events_event_key_uidx on public.payment_callback_events (provider_event_key);
create index if not exists products_active_published_idx
  on public.products (published_at desc) where is_active = true;
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_payment_status_idx on public.orders (payment_status);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create unique index if not exists payment_transactions_one_per_order_idx on public.payment_transactions (order_id);
create index if not exists payment_callback_events_received_at_idx on public.payment_callback_events (received_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = pg_catalog
as $function$
begin
  new.updated_at := now();
  return new;
end;
$function$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders
for each row execute function public.set_updated_at();
drop trigger if exists payment_transactions_set_updated_at on public.payment_transactions;
create trigger payment_transactions_set_updated_at before update on public.payment_transactions
for each row execute function public.set_updated_at();

create or replace function public.consume_api_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_count integer;
begin
  if p_key is null or length(p_key) <> 64 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'Invalid rate limit arguments';
  end if;
  insert into public.api_rate_limits(key_hash, window_started_at, request_count)
  values (p_key, now(), 1)
  on conflict (key_hash) do update
    set request_count = case
      when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then 1
      else public.api_rate_limits.request_count + 1
    end,
    window_started_at = case
      when public.api_rate_limits.window_started_at <= now() - make_interval(secs => p_window_seconds) then now()
      else public.api_rate_limits.window_started_at
    end
  returning request_count into v_count;
  return v_count <= p_limit;
end;
$function$;

create or replace function public.create_order_atomic(
  p_customer jsonb,
  p_shipping_address jsonb,
  p_items jsonb,
  p_lookup_token_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id uuid;
  v_quantity integer;
  v_options jsonb;
  v_option jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_order_id uuid;
  v_order_number text;
  v_subtotal bigint := 0;
  v_shipping bigint := 52000;
  v_line_total bigint;
begin
  if jsonb_typeof(p_customer) <> 'object'
     or jsonb_typeof(p_shipping_address) <> 'object'
     or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) < 1
     or jsonb_array_length(p_items) > 30
     or p_lookup_token_hash is null
     or p_lookup_token_hash !~ '^[a-f0-9]{64}
    raise exception 'Invalid order payload';
  end if;
  if coalesce(length(trim(p_customer->>'name')), 0) not between 1 and 120
     or coalesce(length(trim(p_customer->>'email')), 0) not between 3 and 254
     or coalesce(length(trim(p_customer->>'phone')), 0) not between 7 and 30 then
    raise exception 'Invalid customer data';
  end if;
  if (select count(*) from jsonb_array_elements(p_items)) <>
     (select count(distinct value->>'product_id') from jsonb_array_elements(p_items)) then
    raise exception 'Duplicate product lines are not allowed';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_options := coalesce(v_item->'selected_options', '{}'::jsonb);
    if v_quantity < 1 or v_quantity > 20 or jsonb_typeof(v_options) <> 'object' then
      raise exception 'Invalid product quantity or options';
    end if;
    select * into v_product from public.products where id = v_product_id for update;
    if not found or not v_product.is_active or v_product.published_at is null or v_product.published_at > now() then
      raise exception 'Product unavailable';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock';
    end if;
    if jsonb_typeof(v_product.options) = 'array' then
      for v_option in select value from jsonb_array_elements(v_product.options)
      loop
        if not (v_options ? (v_option->>'name')) or not exists (
          select 1 from jsonb_array_elements_text(coalesce(v_option->'values', '[]'::jsonb)) as allowed(value)
          where allowed.value = v_options->>(v_option->>'name')
        ) then
          raise exception 'Invalid or missing product option';
        end if;
      end loop;
    end if;
    update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
    v_line_total := v_product.price_idr * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_sku', v_product.sku,
      'selected_options', v_options,
      'unit_price_idr', v_product.price_idr,
      'quantity', v_quantity
    ));
  end loop;

  v_order_number := 'ASRI-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders (
    order_number, lookup_token_hash, customer_name, customer_email, customer_phone,
    shipping_address, subtotal_idr, shipping_cost_idr, total_idr, expires_at
  ) values (
    v_order_number, p_lookup_token_hash, trim(p_customer->>'name'), lower(trim(p_customer->>'email')),
    trim(p_customer->>'phone'), p_shipping_address, v_subtotal, v_shipping, v_subtotal + v_shipping,
    now() + interval '24 hours'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, product_sku, selected_options, unit_price_idr, quantity
    ) values (
      v_order_id, (v_item->>'product_id')::uuid, v_item->>'product_name', v_item->>'product_sku',
      v_item->'selected_options', (v_item->>'unit_price_idr')::bigint, (v_item->>'quantity')::integer
    );
  end loop;

  return jsonb_build_object(
    'order_number', v_order_number,
    'subtotal_idr', v_subtotal,
    'shipping_cost_idr', v_shipping,
    'total_idr', v_subtotal + v_shipping
  );
end;
$function$;

create or replace function public.release_expired_order_reservations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_count integer := 0;
begin
  for v_order in
    select * from public.orders
    where payment_status = 'pending'
      and expires_at is not null
      and expires_at <= now()
      and stock_released = false
    for update skip locked
  loop
    for v_item in select product_id, quantity from public.order_items
      where order_id = v_order.id and product_id is not null
    loop
      update public.products set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.product_id;
    end loop;
    update public.orders set
      payment_status = 'expired',
      order_status = 'cancelled',
      stock_released = true
    where id = v_order.id;
    update public.payment_transactions set internal_status = 'expired', transaction_status = coalesce(transaction_status, 'expire')
    where order_id = v_order.id and internal_status = 'pending';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$;

create or replace function public.apply_midtrans_notification(
  p_event_key text,
  p_provider_order_id text,
  p_provider_transaction_id text,
  p_transaction_status text,
  p_fraud_status text,
  p_payment_type text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_payment public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_next text;
  v_event_rows integer;
  v_released boolean := false;
  v_item record;
  v_result text := 'processed';
begin
  if p_event_key !~ '^[a-f0-9]{64}$' or coalesce(p_provider_order_id, '') = ''
     or coalesce(p_provider_transaction_id, '') = '' then
    raise exception 'Invalid notification arguments';
  end if;
  select * into v_payment from public.payment_transactions
    where provider_order_id = p_provider_order_id for update;
  if not found then
    return jsonb_build_object('status', 'transaction_not_found');
  end if;
  select * into v_order from public.orders where id = v_payment.order_id for update;

  insert into public.payment_callback_events (
    provider_event_key, provider_order_id, provider_transaction_id,
    signature_valid, processing_status, payload
  ) values (
    p_event_key, p_provider_order_id, p_provider_transaction_id,
    true, 'received', coalesce(p_payload, '{}'::jsonb)
  ) on conflict (provider_event_key) do nothing;
  get diagnostics v_event_rows = row_count;
  if v_event_rows = 0 then
    return jsonb_build_object('status', 'duplicate');
  end if;

  v_next := case lower(p_transaction_status)
    when 'settlement' then case when p_fraud_status is null or lower(p_fraud_status) = 'accept' then 'success' else 'problem' end
    when 'capture' then case when p_fraud_status is null or lower(p_fraud_status) = 'accept' then 'success' else 'problem' end
    when 'pending' then 'pending'
    when 'deny' then 'failed'
    when 'expire' then 'expired'
    when 'cancel' then 'cancelled'
    when 'refund' then 'refund'
    when 'partial_refund' then 'refund'
    else 'problem'
  end;

  if v_payment.internal_status = 'refund'
     or (v_payment.internal_status = 'success' and v_next <> 'refund')
     or (v_payment.internal_status in ('failed','expired','cancelled') and v_next in ('pending','failed','expired','cancelled')) then
    v_result := 'ignored_stale';
  else
    if v_next in ('failed','expired','cancelled') and not v_order.stock_released then
      for v_item in select product_id, quantity from public.order_items
        where order_id = v_order.id and product_id is not null
      loop
        update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
      end loop;
      v_released := true;
    end if;

    update public.payment_transactions set
      provider_transaction_id = p_provider_transaction_id,
      transaction_status = p_transaction_status,
      fraud_status = p_fraud_status,
      payment_type = p_payment_type,
      internal_status = v_next
    where id = v_payment.id;

    update public.orders set
      payment_status = v_next,
      stock_released = stock_released or v_released,
      order_status = case
        when v_next = 'success' and (stock_released or v_released) then 'problem'
        when v_next = 'success' then 'processing'
        when v_next in ('refund','problem') then 'problem'
        when v_next in ('failed','expired','cancelled') then 'cancelled'
        else order_status
      end
    where id = v_order.id;
  end if;

  update public.payment_callback_events set
    processing_status = case when v_result = 'processed' then 'processed' else 'ignored' end,
    processed_at = now()
  where provider_event_key = p_event_key;

  return jsonb_build_object('status', v_result, 'payment_status', case when v_result = 'processed' then v_next else v_payment.internal_status end);
end;
$function$;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_callback_events enable row level security;
alter table public.api_rate_limits enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active = true and published_at is not null and published_at <= now());

revoke all on public.products, public.orders, public.order_items,
  public.payment_transactions, public.payment_callback_events, public.api_rate_limits
  from anon, authenticated;
grant select on public.products to anon, authenticated;
grant all on public.products, public.orders, public.order_items,
  public.payment_transactions, public.payment_callback_events, public.api_rate_limits to service_role;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_order_atomic(jsonb, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.release_expired_order_reservations() from public, anon, authenticated;
revoke all on function public.apply_midtrans_notification(text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_order_atomic(jsonb, jsonb, jsonb, text) to service_role;
grant execute on function public.release_expired_order_reservations() to service_role;
grant execute on function public.apply_midtrans_notification(text, text, text, text, text, text, jsonb) to service_role;

commit;
 then
    raise exception 'Invalid order payload';
  end if;
  if coalesce(length(trim(p_customer->>'name')), 0) not between 1 and 120
     or coalesce(length(trim(p_customer->>'email')), 0) not between 3 and 254
     or coalesce(length(trim(p_customer->>'phone')), 0) not between 7 and 30 then
    raise exception 'Invalid customer data';
  end if;
  if (select count(*) from jsonb_array_elements(p_items)) <>
     (select count(distinct value->>'product_id') from jsonb_array_elements(p_items)) then
    raise exception 'Duplicate product lines are not allowed';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := (v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    v_options := coalesce(v_item->'selected_options', '{}'::jsonb);
    if v_quantity < 1 or v_quantity > 20 or jsonb_typeof(v_options) <> 'object' then
      raise exception 'Invalid product quantity or options';
    end if;
    select * into v_product from public.products where id = v_product_id for update;
    if not found or not v_product.is_active or v_product.published_at is null or v_product.published_at > now() then
      raise exception 'Product unavailable';
    end if;
    if v_product.stock_quantity < v_quantity then
      raise exception 'Insufficient stock';
    end if;
    update public.products set stock_quantity = stock_quantity - v_quantity where id = v_product.id;
    v_line_total := v_product.price_idr * v_quantity;
    v_subtotal := v_subtotal + v_line_total;
    v_lines := v_lines || jsonb_build_array(jsonb_build_object(
      'product_id', v_product.id,
      'product_name', v_product.name,
      'product_sku', v_product.sku,
      'selected_options', v_options,
      'unit_price_idr', v_product.price_idr,
      'quantity', v_quantity
    ));
  end loop;

  v_order_number := 'ASRI-' || to_char(now(), 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
  insert into public.orders (
    order_number, lookup_token_hash, customer_name, customer_email, customer_phone,
    shipping_address, subtotal_idr, shipping_cost_idr, total_idr, expires_at
  ) values (
    v_order_number, p_lookup_token_hash, trim(p_customer->>'name'), lower(trim(p_customer->>'email')),
    trim(p_customer->>'phone'), p_shipping_address, v_subtotal, v_shipping, v_subtotal + v_shipping,
    now() + interval '24 hours'
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(v_lines)
  loop
    insert into public.order_items (
      order_id, product_id, product_name, product_sku, selected_options, unit_price_idr, quantity
    ) values (
      v_order_id, (v_item->>'product_id')::uuid, v_item->>'product_name', v_item->>'product_sku',
      v_item->'selected_options', (v_item->>'unit_price_idr')::bigint, (v_item->>'quantity')::integer
    );
  end loop;

  return jsonb_build_object(
    'order_number', v_order_number,
    'subtotal_idr', v_subtotal,
    'shipping_cost_idr', v_shipping,
    'total_idr', v_subtotal + v_shipping
  );
end;
$function$;

create or replace function public.release_expired_order_reservations()
returns integer
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_count integer := 0;
begin
  for v_order in
    select * from public.orders
    where payment_status = 'pending'
      and expires_at is not null
      and expires_at <= now()
      and stock_released = false
    for update skip locked
  loop
    for v_item in select product_id, quantity from public.order_items
      where order_id = v_order.id and product_id is not null
    loop
      update public.products set stock_quantity = stock_quantity + v_item.quantity
      where id = v_item.product_id;
    end loop;
    update public.orders set
      payment_status = 'expired',
      order_status = 'cancelled',
      stock_released = true
    where id = v_order.id;
    update public.payment_transactions set internal_status = 'expired', transaction_status = coalesce(transaction_status, 'expire')
    where order_id = v_order.id and internal_status = 'pending';
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$function$;

create or replace function public.apply_midtrans_notification(
  p_event_key text,
  p_provider_order_id text,
  p_provider_transaction_id text,
  p_transaction_status text,
  p_fraud_status text,
  p_payment_type text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, pg_temp
as $function$
declare
  v_payment public.payment_transactions%rowtype;
  v_order public.orders%rowtype;
  v_next text;
  v_event_rows integer;
  v_released boolean := false;
  v_item record;
  v_result text := 'processed';
begin
  if p_event_key !~ '^[a-f0-9]{64}$' or coalesce(p_provider_order_id, '') = ''
     or coalesce(p_provider_transaction_id, '') = '' then
    raise exception 'Invalid notification arguments';
  end if;
  select * into v_payment from public.payment_transactions
    where provider_order_id = p_provider_order_id for update;
  if not found then
    return jsonb_build_object('status', 'transaction_not_found');
  end if;
  select * into v_order from public.orders where id = v_payment.order_id for update;

  insert into public.payment_callback_events (
    provider_event_key, provider_order_id, provider_transaction_id,
    signature_valid, processing_status, payload
  ) values (
    p_event_key, p_provider_order_id, p_provider_transaction_id,
    true, 'received', coalesce(p_payload, '{}'::jsonb)
  ) on conflict (provider_event_key) do nothing;
  get diagnostics v_event_rows = row_count;
  if v_event_rows = 0 then
    return jsonb_build_object('status', 'duplicate');
  end if;

  v_next := case lower(p_transaction_status)
    when 'settlement' then 'success'
    when 'capture' then case when p_fraud_status is null or lower(p_fraud_status) = 'accept' then 'success' else 'problem' end
    when 'pending' then 'pending'
    when 'deny' then 'failed'
    when 'expire' then 'expired'
    when 'cancel' then 'cancelled'
    when 'refund' then 'refund'
    when 'partial_refund' then 'refund'
    else 'problem'
  end;

  if v_payment.internal_status = 'refund'
     or (v_payment.internal_status = 'success' and v_next <> 'refund')
     or (v_payment.internal_status in ('failed','expired','cancelled') and v_next in ('pending','failed','expired','cancelled')) then
    v_result := 'ignored_stale';
  else
    if v_next in ('failed','expired','cancelled') and not v_order.stock_released then
      for v_item in select product_id, quantity from public.order_items
        where order_id = v_order.id and product_id is not null
      loop
        update public.products set stock_quantity = stock_quantity + v_item.quantity where id = v_item.product_id;
      end loop;
      v_released := true;
    end if;

    update public.payment_transactions set
      provider_transaction_id = p_provider_transaction_id,
      transaction_status = p_transaction_status,
      fraud_status = p_fraud_status,
      payment_type = p_payment_type,
      internal_status = v_next
    where id = v_payment.id;

    update public.orders set
      payment_status = v_next,
      stock_released = stock_released or v_released,
      order_status = case
        when v_next = 'success' and (stock_released or v_released) then 'problem'
        when v_next = 'success' then 'processing'
        when v_next in ('refund','problem') then 'problem'
        when v_next in ('failed','expired','cancelled') then 'cancelled'
        else order_status
      end
    where id = v_order.id;
  end if;

  update public.payment_callback_events set
    processing_status = case when v_result = 'processed' then 'processed' else 'ignored' end,
    processed_at = now()
  where provider_event_key = p_event_key;

  return jsonb_build_object('status', v_result, 'payment_status', case when v_result = 'processed' then v_next else v_payment.internal_status end);
end;
$function$;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payment_transactions enable row level security;
alter table public.payment_callback_events enable row level security;
alter table public.api_rate_limits enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select to anon, authenticated
  using (is_active = true and published_at is not null and published_at <= now());

revoke all on public.products, public.orders, public.order_items,
  public.payment_transactions, public.payment_callback_events, public.api_rate_limits
  from anon, authenticated;
grant select on public.products to anon, authenticated;
grant all on public.products, public.orders, public.order_items,
  public.payment_transactions, public.payment_callback_events, public.api_rate_limits to service_role;

revoke all on function public.consume_api_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke all on function public.create_order_atomic(jsonb, jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.release_expired_order_reservations() from public, anon, authenticated;
revoke all on function public.apply_midtrans_notification(text, text, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.consume_api_rate_limit(text, integer, integer) to service_role;
grant execute on function public.create_order_atomic(jsonb, jsonb, jsonb, text) to service_role;
grant execute on function public.release_expired_order_reservations() to service_role;
grant execute on function public.apply_midtrans_notification(text, text, text, text, text, text, jsonb) to service_role;

commit;
