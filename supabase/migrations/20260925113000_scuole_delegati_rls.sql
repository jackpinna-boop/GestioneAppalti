create schema if not exists private;

create or replace function private.school_admin_can_manage_school(p_school_id uuid,p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.scuole s join public.user_roles ur on ur.ente_id=s.ente_id and ur.user_id=p_user_id where s.id=p_school_id and ur.ruolo in ('superadmin','admin_ente')); $$;

create or replace function private.school_user_can_view(p_school_user_id uuid,p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.scuola_utenti su join public.scuole s on s.id=su.scuola_id where su.id=p_school_user_id and (su.user_id=p_user_id or exists(select 1 from public.user_roles ur where ur.user_id=p_user_id and ur.ente_id=s.ente_id and ur.ruolo in ('superadmin','admin_ente')))); $$;

create or replace function private.school_has_user(p_school_id uuid,p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.scuola_utenti su where su.scuola_id=p_school_id and su.user_id=p_user_id and su.attivo and su.ruolo in ('dirigente_scolastico','delegato_scolastico') and (su.data_fine is null or su.data_fine>=current_date)); $$;

create or replace function private.school_user_admin_can_manage(p_school_user_id uuid,p_user_id uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.scuola_utenti su join public.scuole s on s.id=su.scuola_id join public.user_roles ur on ur.user_id=p_user_id and ur.ente_id=s.ente_id where su.id=p_school_user_id and ur.ruolo in ('superadmin','admin_ente')); $$;

create or replace function private.school_building_belongs(p_school_id uuid,p_building_id uuid) returns boolean
language sql stable security definer set search_path=''
as $$ select exists(select 1 from public.scuole_edifici se where se.scuola_id=p_school_id and se.edificio_id=p_building_id and se.attivo); $$;

revoke all on function private.school_admin_can_manage_school(uuid,uuid) from public,anon;
revoke all on function private.school_user_can_view(uuid,uuid) from public,anon;
revoke all on function private.school_has_user(uuid,uuid) from public,anon;
revoke all on function private.school_user_admin_can_manage(uuid,uuid) from public,anon;
revoke all on function private.school_building_belongs(uuid,uuid) from public,anon;
grant execute on function private.school_admin_can_manage_school(uuid,uuid) to authenticated;
grant execute on function private.school_user_can_view(uuid,uuid) to authenticated;
grant execute on function private.school_has_user(uuid,uuid) to authenticated;
grant execute on function private.school_user_admin_can_manage(uuid,uuid) to authenticated;
grant execute on function private.school_building_belongs(uuid,uuid) to authenticated;

drop policy if exists scuola_utenti_manage on public.scuola_utenti;
drop policy if exists scuola_utenti_select on public.scuola_utenti;
drop policy if exists scuola_utenti_insert on public.scuola_utenti;
drop policy if exists scuola_utenti_update on public.scuola_utenti;
drop policy if exists scuola_utenti_delete on public.scuola_utenti;
create policy scuola_utenti_select on public.scuola_utenti for select to authenticated using ((select private.school_user_can_view(id,auth.uid())));
create policy scuola_utenti_insert on public.scuola_utenti for insert to authenticated with check ((select private.school_admin_can_manage_school(scuola_id,auth.uid())));
create policy scuola_utenti_update on public.scuola_utenti for update to authenticated using ((select private.school_admin_can_manage_school(scuola_id,auth.uid()))) with check ((select private.school_admin_can_manage_school(scuola_id,auth.uid())));
create policy scuola_utenti_delete on public.scuola_utenti for delete to authenticated using ((select private.school_admin_can_manage_school(scuola_id,auth.uid())));

drop policy if exists scuole_select on public.scuole;
drop policy if exists scuole_manage on public.scuole;
create policy scuole_select on public.scuole for select to authenticated using (is_superadmin() or (select private.school_has_user(id,auth.uid())) or exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.ente_id=scuole.ente_id and ur.ruolo in ('admin_ente','superadmin')));
create policy scuole_manage on public.scuole for all to authenticated using (is_superadmin() or exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.ente_id=scuole.ente_id and ur.ruolo='admin_ente')) with check (is_superadmin() or exists(select 1 from public.user_roles ur where ur.user_id=auth.uid() and ur.ente_id=scuole.ente_id and ur.ruolo='admin_ente'));

drop policy if exists scuole_edifici_select on public.scuole_edifici;
drop policy if exists scuole_edifici_manage on public.scuole_edifici;
create policy scuole_edifici_select on public.scuole_edifici for select to authenticated using (is_superadmin() or (select private.school_has_user(scuola_id,auth.uid())) or exists(select 1 from public.user_roles ur join public.scuole s on s.ente_id=ur.ente_id where s.id=scuole_edifici.scuola_id and ur.user_id=auth.uid() and ur.ruolo in ('admin_ente','superadmin')));
create policy scuole_edifici_manage on public.scuole_edifici for all to authenticated using (is_superadmin() or exists(select 1 from public.user_roles ur join public.scuole s on s.ente_id=ur.ente_id where s.id=scuole_edifici.scuola_id and ur.user_id=auth.uid() and ur.ruolo='admin_ente')) with check (is_superadmin() or exists(select 1 from public.user_roles ur join public.scuole s on s.ente_id=ur.ente_id where s.id=scuole_edifici.scuola_id and ur.user_id=auth.uid() and ur.ruolo='admin_ente'));

drop policy if exists scuola_utenti_edifici_manage on public.scuola_utenti_edifici;
drop policy if exists scuola_utenti_edifici_select on public.scuola_utenti_edifici;
create policy scuola_utenti_edifici_select on public.scuola_utenti_edifici for select to authenticated using (is_superadmin() or exists(select 1 from public.scuola_utenti su where su.id=scuola_utenti_edifici.scuola_utente_id and su.user_id=auth.uid() and su.attivo) or (select private.school_user_admin_can_manage(scuola_utente_id,auth.uid())));
create policy scuola_utenti_edifici_manage on public.scuola_utenti_edifici for all to authenticated using ((select private.school_user_admin_can_manage(scuola_utente_id,auth.uid()))) with check ((select private.school_user_admin_can_manage(scuola_utente_id,auth.uid())) and exists(select 1 from public.scuola_utenti su where su.id=scuola_utenti_edifici.scuola_utente_id and (select private.school_building_belongs(su.scuola_id,edificio_id))));