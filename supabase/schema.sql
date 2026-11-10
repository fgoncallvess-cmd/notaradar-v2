-- NotaRadar 2.0. Execute no SQL Editor do SEU projeto Supabase.
-- Instalação idempotente: não remove dados existentes.
begin;
create table if not exists public.notaradar_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  year integer not null default 2026 check (year = 2026),
  payload jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  primary key (user_id, year),
  constraint valid_payload check (
    jsonb_typeof(payload) = 'object'
    and (payload ->> 'version')::integer = 2
    and (payload ->> 'year')::integer = year
    and jsonb_typeof(payload -> 'grades') = 'object'
    and jsonb_typeof(payload -> 'goals') = 'array'
    and jsonb_typeof(payload -> 'recoveries') = 'object'
    and jsonb_typeof(payload -> 'settings') = 'object'
    and payload ?& array['version','year','subjects','grades','goals','recoveries','settings']
    and octet_length(payload::text) <= 1000000
  )
);
alter table public.notaradar_data enable row level security;
alter table public.notaradar_data force row level security;
revoke all on table public.notaradar_data from public, anon;
revoke all on table public.notaradar_data from authenticated;
grant select, insert, update on table public.notaradar_data to authenticated;
drop policy if exists "Read own academic data" on public.notaradar_data;
create policy "Read own academic data" on public.notaradar_data for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Insert own academic data" on public.notaradar_data;
create policy "Insert own academic data" on public.notaradar_data for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Update own academic data" on public.notaradar_data;
create policy "Update own academic data" on public.notaradar_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- SECURITY INVOKER: policies also apply inside this function.
-- The caller cannot choose a different user_id; auth.uid() is authoritative.
create or replace function public.save_notaradar_data(p_payload jsonb, p_expected_revision integer)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  owner_id uuid := auth.uid();
  next_revision integer;
begin
  if owner_id is null then raise exception 'authentication_required'; end if;
  if p_expected_revision is null or p_expected_revision < 0 then raise exception 'invalid_revision'; end if;
  if p_payload is null or coalesce(p_payload ->> 'year','') <> '2026' or coalesce(p_payload ->> 'version','') <> '2' then raise exception 'invalid_payload'; end if;
  if p_expected_revision = 0 then
    insert into public.notaradar_data (user_id,year,payload,revision)
      values (owner_id,2026,p_payload,1)
      on conflict (user_id,year) do nothing
      returning revision into next_revision;
  else
    update public.notaradar_data set payload=p_payload,revision=revision+1,updated_at=now()
      where user_id=owner_id and year=2026 and revision=p_expected_revision
      returning revision into next_revision;
  end if;
  if next_revision is null then raise exception 'revision_conflict'; end if;
  return next_revision;
end;
$$;
revoke all on function public.save_notaradar_data(jsonb,integer) from public,anon;
grant execute on function public.save_notaradar_data(jsonb,integer) to authenticated;
commit;
