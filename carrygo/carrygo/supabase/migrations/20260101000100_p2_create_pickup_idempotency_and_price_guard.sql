-- Applied to the project as migration "p2_create_pickup_idempotency_and_price_guard".
-- NOTE: Phase 1 migrations (p1_core_schema, p1_rls_policies, p1_rpc_functions) live in the Supabase
-- migration history; export them with `supabase db pull` so this repo matches what is deployed.
alter table public.pickups add column idempotency_key uuid;
create unique index pickups_idempotency_idx on public.pickups (customer_id, idempotency_key) where idempotency_key is not null;

drop function public.create_pickup(text, integer, text, numeric, numeric, timestamptz);

create function public.create_pickup(
  p_category text, p_quantity integer, p_address text, p_lat numeric, p_lng numeric,
  p_preferred_time timestamptz default null, p_idempotency_key uuid default null, p_expected_price numeric default null)
returns public.pickups language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_price record; v_row public.pickups; v_open integer;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if not exists (select 1 from public.profiles where id = v_uid and role = 'customer' and not is_suspended) then
    raise exception 'wrong_role_or_suspended' using errcode = '42501'; end if;
  if p_idempotency_key is not null then
    select * into v_row from public.pickups where customer_id = v_uid and idempotency_key = p_idempotency_key;
    if found then return v_row; end if;
  end if;
  p_address := btrim(p_address);
  if p_address is null or char_length(p_address) < 5 or char_length(p_address) > 300 then raise exception 'invalid_address' using errcode = '22023'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then raise exception 'invalid_coordinates' using errcode = '22023'; end if;
  if p_preferred_time is not null and (p_preferred_time < now() - interval '5 minutes' or p_preferred_time > now() + interval '30 days') then
    raise exception 'invalid_time' using errcode = '22023'; end if;
  select count(*) into v_open from public.pickups where customer_id = v_uid and status in ('requested','assigned','en_route','arrived','collected');
  if v_open >= 5 then raise exception 'too_many_open_pickups' using errcode = 'P0001'; end if;
  select * into v_price from private.compute_price(p_category, p_quantity);
  if p_expected_price is not null and p_expected_price <> v_price.amount then raise exception 'price_changed' using errcode = 'P0001'; end if;
  begin
    insert into public.pickups (customer_id, category_code, quantity, address_text, lat, lng, preferred_time, estimated_price, currency, price_was_approved, idempotency_key)
    values (v_uid, p_category, p_quantity, p_address, p_lat, p_lng, p_preferred_time, v_price.amount, v_price.currency, v_price.approved, p_idempotency_key)
    returning * into v_row;
  exception when unique_violation then
    select * into v_row from public.pickups where customer_id = v_uid and idempotency_key = p_idempotency_key;
    if not found then raise; end if;
  end;
  return v_row;
end $$;

revoke all on function public.create_pickup(text, integer, text, numeric, numeric, timestamptz, uuid, numeric) from public, anon;
grant execute on function public.create_pickup(text, integer, text, numeric, numeric, timestamptz, uuid, numeric) to authenticated;
