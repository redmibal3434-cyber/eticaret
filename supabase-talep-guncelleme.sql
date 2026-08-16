-- Mevcut Kampanya Pro veritabanını 16 haneli talep numarası ve
-- SK-05-32 biçimindeki sosyal medya avantaj kodu ve TK-123 biçimindeki
-- talep kodu akışına geçirir.
-- Kampanya kodu tablosu ve eski kampanya alanları kaldırılır.

alter table public.orders
  add column if not exists request_no text;

alter table public.orders
  add column if not exists social_code text;

alter table public.orders
  add column if not exists request_code text;

alter table public.orders
  drop constraint if exists orders_request_code_check;

alter table public.orders
  alter column request_code type text using request_code::text;

update public.orders
set request_no = lpad((abs(hashtext(id::text)::bigint) % 10000000000000000)::text, 16, '0')
where request_no is null;

update public.orders
set social_code = 'SK-00-00'
where social_code is null;

update public.orders
set request_code = case
  when request_code ~ '^[0-9]{3}$' then 'TK-' || request_code
  else 'TK-000'
end
where request_code is null or request_code !~ '^TK-[0-9]{3}$';

alter table public.orders
  alter column request_no set not null;

alter table public.orders
  alter column social_code set not null;

alter table public.orders
  alter column request_code set not null;

alter table public.orders
  drop constraint if exists orders_request_no_check;

alter table public.orders
  add constraint orders_request_no_check check (request_no ~ '^[0-9]{16}$');

alter table public.orders
  drop constraint if exists orders_social_code_check;

alter table public.orders
  add constraint orders_social_code_check check (social_code ~ '^SK-[0-9]{2}-[0-9]{2}$');

alter table public.orders
  drop constraint if exists orders_request_code_check;

alter table public.orders
  add constraint orders_request_code_check check (request_code ~ '^TK-[0-9]{3}$');

alter table public.orders
  drop column if exists promo_code_id,
  drop column if exists promo_code;

drop function if exists public.place_order_v1(uuid, text, text, text, text, text);
drop function if exists public.place_order_v1(uuid, text, text, text, text, text, text);
drop function if exists public.place_order_v1(uuid, text, text, text, text, text, text, text);
drop table if exists public.promo_codes cascade;

create function public.place_order_v1(
  p_product_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_request_no text,
  p_social_code text,
  p_request_code text,
  p_session_id text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product public.products%rowtype;
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

  if p_request_no !~ '^[0-9]{16}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_request');
  end if;

  if p_social_code !~ '^SK-[0-9]{2}-[0-9]{2}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_social_code');
  end if;

  if p_request_code !~ '^TK-[0-9]{3}$' then
    return jsonb_build_object('ok', false, 'error', 'invalid_request_code');
  end if;

  v_reference := 'KMP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));

  insert into public.orders(
    order_reference, product_id, product_title, unit_price,
    customer_name, customer_phone, customer_address,
    request_no, social_code, request_code, session_id
  ) values (
    v_reference, v_product.id, v_product.title, v_product.price,
    p_customer_name, p_customer_phone, p_customer_address,
    p_request_no, p_social_code, p_request_code, p_session_id
  );

  update public.products
  set stock = stock - 1, updated_at = now()
  where id = v_product.id;

  return jsonb_build_object('ok', true, 'orderReference', v_reference);
end;
$$;
