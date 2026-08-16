create extension if not exists pgcrypto;

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  short_description text not null default '',
  description text not null default '',
  image_url text not null default '',
  badge text not null default '',
  old_price numeric(12,2) not null default 0,
  price numeric(12,2) not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9-]{6,32}$'),
  label text not null default '',
  max_uses integer not null default 1 check (max_uses > 0),
  used_count integer not null default 0 check (used_count >= 0),
  expires_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_reference text not null unique,
  product_id uuid references public.products(id),
  product_title text not null,
  unit_price numeric(12,2) not null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text not null,
  promo_code_id uuid references public.promo_codes(id),
  promo_code text not null,
  session_id text,
  status text not null default 'confirmed' check (status in ('confirmed','preparing','shipped','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.live_sessions (
  session_id text primary key,
  stage text not null check (stage in ('homepage','product','cart','address','campaign','processing','result')),
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now()
);

create index if not exists products_active_sort_idx on public.products(active, sort_order);
create index if not exists orders_created_idx on public.orders(created_at desc);
create index if not exists live_sessions_last_seen_idx on public.live_sessions(last_seen desc);

alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.promo_codes enable row level security;
alter table public.orders enable row level security;
alter table public.live_sessions enable row level security;

insert into storage.buckets (id, name, public)
values ('site-assets', 'site-assets', true)
on conflict (id) do update set public = true;

insert into public.site_settings(key, value) values
  ('site_name', '"Fırsat Mağazası"'::jsonb),
  ('announcement', '"Bugüne özel ücretsiz kargo ve sınırlı stok"'::jsonb),
  ('logo_url', '""'::jsonb),
  ('hero_badge', '"HAFTANIN FIRSATI"'::jsonb),
  ('hero_title', '"Evinize değer katan ürünlerde özel kampanya"'::jsonb),
  ('hero_text', '"Seçili ürünleri kampanya fiyatıyla keşfedin. Güvenli talep formu ve hızlı müşteri desteği."'::jsonb),
  ('banner_url', '""'::jsonb),
  ('theme_primary', '"#b42318"'::jsonb),
  ('trust_1', '"Ücretsiz Kargo"'::jsonb),
  ('trust_2', '"Sınırlı Stok"'::jsonb),
  ('trust_3', '"Güvenli Talep"'::jsonb),
  ('footer_title', '"Fırsatları kaçırmayın"'::jsonb),
  ('footer_text', '"Kampanyalı ürünler stoklarla sınırlıdır. Sorularınız için bizimle iletişime geçebilirsiniz."'::jsonb),
  ('footer_logo_url', '""'::jsonb),
  ('footer_image_1', '""'::jsonb),
  ('footer_image_2', '""'::jsonb),
  ('footer_image_3', '""'::jsonb),
  ('contact_phone', '""'::jsonb),
  ('contact_email', '""'::jsonb)
on conflict (key) do nothing;

insert into public.products(title, short_description, description, badge, old_price, price, stock, sort_order)
select
  'Premium Mutfak Seti',
  'Günlük kullanım için dayanıklı ve şık set',
  'Modern mutfaklar için tasarlanan set, kampanyaya özel fiyat ve ücretsiz kargo avantajıyla sunulur.',
  '%35 İNDİRİM',
  4590,
  2990,
  25,
  1
where not exists (select 1 from public.products);

create or replace function public.place_order_v1(
  p_product_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_promo_code text,
  p_session_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
  v_code public.promo_codes%rowtype;
  v_reference text;
begin
  select * into v_product from public.products
  where id = p_product_id and active = true
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'product_not_found');
  end if;

  if v_product.stock <= 0 then
    return jsonb_build_object('ok', false, 'error', 'out_of_stock');
  end if;

  select * into v_code from public.promo_codes
  where code = upper(p_promo_code) and active = true
  for update;

  if not found or v_code.used_count >= v_code.max_uses or (v_code.expires_at is not null and v_code.expires_at < now()) then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  v_reference := 'KMP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.orders(
    order_reference, product_id, product_title, unit_price,
    customer_name, customer_phone, customer_address,
    promo_code_id, promo_code, session_id
  ) values (
    v_reference, v_product.id, v_product.title, v_product.price,
    p_customer_name, p_customer_phone, p_customer_address,
    v_code.id, v_code.code, p_session_id
  );

  update public.products set stock = stock - 1, updated_at = now() where id = v_product.id;
  update public.promo_codes set used_count = used_count + 1 where id = v_code.id;

  return jsonb_build_object('ok', true, 'orderReference', v_reference);
end;
$$;
