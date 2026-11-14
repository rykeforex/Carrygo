-- Applied as two migrations: "p4_location_sharing_only_while_travelling" and "p4b_update_location_validates_input".
-- Final state shown here. Location may only be shared while en_route/arrived, with validated input.
create or replace function public.update_location(p_pickup uuid, p_lat numeric, p_lng numeric, p_heading numeric default null, p_accuracy numeric default null)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid();
begin
  if not private.is_approved_collector() then raise exception 'not_approved_collector' using errcode = '42501'; end if;
  if p_lat is null or p_lng is null or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'invalid_coordinates' using errcode = '22023'; end if;
  if (p_heading is not null and p_heading not between 0 and 360) or (p_accuracy is not null and p_accuracy < 0) then
    raise exception 'invalid_location_data' using errcode = '22023'; end if;
  if not exists (select 1 from public.pickups where id = p_pickup and collector_id = v_uid and status in ('en_route','arrived')) then
    raise exception 'not_sharing_allowed' using errcode = '42501'; end if;
  if exists (select 1 from public.collector_locations where collector_id = v_uid and recorded_at > now() - interval '2 seconds') then return false; end if;
  insert into public.collector_locations (collector_id, pickup_id, lat, lng, heading, accuracy_m, recorded_at)
  values (v_uid, p_pickup, p_lat, p_lng, p_heading, p_accuracy, now())
  on conflict (collector_id) do update set pickup_id = excluded.pickup_id, lat = excluded.lat, lng = excluded.lng,
    heading = excluded.heading, accuracy_m = excluded.accuracy_m, recorded_at = excluded.recorded_at;
  return true;
end $$;

drop policy cl_select_customer on public.collector_locations;
create policy cl_select_customer on public.collector_locations for select to authenticated using (
  exists (select 1 from public.pickups p where p.id = collector_locations.pickup_id
          and p.customer_id = auth.uid() and p.status in ('en_route','arrived')));
