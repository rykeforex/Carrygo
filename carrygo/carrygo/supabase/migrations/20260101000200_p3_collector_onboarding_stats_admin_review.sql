-- Applied to the project as migration "p3_collector_onboarding_stats_admin_review".
alter table public.collector_profiles add column id_document_type text
  check (id_document_type is null or id_document_type in ('ghana_card','drivers_license','passport'));

drop function public.my_collector_application();
create function public.my_collector_application()
returns table(status public.collector_status, vehicle_type text, review_notes text, created_at timestamptz,
              reviewed_at timestamptz, has_document boolean, id_document_type text)
language sql stable security definer set search_path = '' as $$
  select c.status, c.vehicle_type, c.review_notes, c.created_at, c.reviewed_at, c.id_document_path is not null, c.id_document_type
  from public.collector_profiles c where c.user_id = auth.uid()
$$;

create function public.attach_collector_document(p_path text, p_doc_type text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_status public.collector_status;
begin
  if v_uid is null then raise exception 'not_authenticated' using errcode = '28000'; end if;
  if p_doc_type is null or p_doc_type not in ('ghana_card','drivers_license','passport') then raise exception 'invalid_document_type' using errcode = '22023'; end if;
  select status into v_status from public.collector_profiles where user_id = v_uid for update;
  if not found then raise exception 'no_application' using errcode = 'P0002'; end if;
  if v_status not in ('pending','rejected') then raise exception 'application_locked' using errcode = 'P0001'; end if;
  if p_path is null or p_path !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[A-Za-z0-9._-]{1,120}$'
     or split_part(p_path, '/', 1) <> v_uid::text then
    raise exception 'invalid_document_path' using errcode = '22023'; end if;
  if not exists (select 1 from storage.objects o where o.bucket_id = 'collector-documents' and o.name = p_path) then
    raise exception 'document_not_uploaded' using errcode = 'P0002'; end if;
  update public.collector_profiles
    set id_document_path = p_path, id_document_type = p_doc_type, status = 'pending',
        review_notes = null, reviewed_by = null, reviewed_at = null
  where user_id = v_uid;
  insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (v_uid, 'collector_document_submitted', 'collector_profiles', v_uid::text, jsonb_build_object('doc_type', p_doc_type));
  return true;
end $$;

create function public.my_collector_stats()
returns table(completed_jobs integer, rating_avg numeric, rating_count integer, total_job_value numeric,
              commission_bps integer, commission_approved boolean, estimated_earnings numeric)
language plpgsql stable security definer set search_path = '' as $$
declare v_uid uuid := auth.uid(); v_bps integer; v_appr boolean; v_total numeric;
begin
  if not private.is_approved_collector() then raise exception 'not_approved_collector' using errcode = '42501'; end if;
  select (ps.value #>> '{}')::integer, ps.is_approved into v_bps, v_appr from public.platform_settings ps where ps.key = 'commission_bps';
  v_bps := coalesce(v_bps, 2000); v_appr := coalesce(v_appr, false);
  select coalesce(sum(k.final_price), 0) into v_total from public.pickups k where k.collector_id = v_uid and k.status = 'completed';
  return query
    select c.completed_jobs, c.rating_avg, c.rating_count, v_total, v_bps, v_appr, round(v_total * (10000 - v_bps) / 10000, 2)
    from public.collector_profiles c where c.user_id = v_uid;
end $$;

create function public.admin_list_collectors(p_status text default null)
returns table(user_id uuid, full_name text, phone text, email text, vehicle_type text, status public.collector_status,
              id_document_path text, id_document_type text, review_notes text, created_at timestamptz,
              reviewed_at timestamptz, completed_jobs integer, rating_avg numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
    select c.user_id, p.full_name, p.phone, u.email::text, c.vehicle_type, c.status, c.id_document_path, c.id_document_type,
           c.review_notes, c.created_at, c.reviewed_at, c.completed_jobs, c.rating_avg
    from public.collector_profiles c
    join public.profiles p on p.id = c.user_id
    join auth.users u on u.id = c.user_id
    where p_status is null or c.status::text = p_status
    order by c.created_at desc limit 200;
end $$;

revoke all on function public.my_collector_application() from public, anon;
revoke all on function public.attach_collector_document(text, text) from public, anon;
revoke all on function public.my_collector_stats() from public, anon;
revoke all on function public.admin_list_collectors(text) from public, anon;
grant execute on function public.my_collector_application() to authenticated;
grant execute on function public.attach_collector_document(text, text) to authenticated;
grant execute on function public.my_collector_stats() to authenticated;
grant execute on function public.admin_list_collectors(text) to authenticated;
