create or replace function public.is_school_portal_user(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id=p_user_id
      and ur.ruolo in ('dirigente_scolastico','delegato_scolastico')
  )
  and exists (
    select 1 from public.scuola_utenti su
    where su.user_id=p_user_id
      and su.attivo
      and su.ruolo in ('dirigente_scolastico','delegato_scolastico')
      and (su.data_fine is null or su.data_fine >= current_date)
  );
$$;

revoke all on function public.is_school_portal_user(uuid) from public, anon;
grant execute on function public.is_school_portal_user(uuid) to authenticated;

create or replace function public.school_user_has_building(p_user_id uuid, p_building_id uuid)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
select exists(
  select 1
  from public.scuola_utenti su
  join public.scuola_utenti_edifici sue on sue.scuola_utente_id=su.id
  join public.scuole s on s.id=su.scuola_id
  join public.scuole_edifici se on se.scuola_id=s.id and se.edificio_id=sue.edificio_id and se.attivo
  where su.user_id=p_user_id
    and su.attivo
    and su.ruolo in ('dirigente_scolastico','delegato_scolastico')
    and sue.edificio_id=p_building_id
    and sue.attivo
    and s.attiva
    and (su.data_fine is null or su.data_fine>=current_date)
    and (sue.data_fine is null or sue.data_fine>=current_date)
);
$$;