-- Permessi per edificio applicati dal database (edifici_permessi).
--
-- Semantica di private.user_can_building(ente, edificio, azione):
--   * superadmin e admin_ente dell'ente: sempre consentito (esenti);
--   * utente senza righe in edifici_permessi per l'ente: consentito
--     (vale solo la matrice permessi_ruoli / permessi_utenti_risorse);
--   * utente con almeno una riga: serve una riga con all_buildings=true
--     oppure con quell'edificio, e il flag corrispondente all'azione
--     (can_update per 'update', can_delete per 'delete').
--   * edificio nullo: nessun vincolo per edificio (consentito).
-- La funzione si aggiunge (AND) al controllo della matrice nelle policy
-- UPDATE/DELETE di edifici, impianti_manutentivi e manutenzioni.

create or replace function private.user_can_building(p_ente_id uuid, p_edificio_id uuid, p_action text)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select
    p_edificio_id is null
    or exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and (ur.ruolo = 'superadmin'
             or (ur.ruolo = 'admin_ente' and ur.ente_id = p_ente_id))
    )
    or not exists (
      select 1 from public.edifici_permessi ep
      where ep.ente_id = p_ente_id and ep.user_id = (select auth.uid())
    )
    or exists (
      select 1 from public.edifici_permessi ep
      where ep.ente_id = p_ente_id
        and ep.user_id = (select auth.uid())
        and (ep.all_buildings or ep.edificio_id = p_edificio_id)
        and case p_action
              when 'update' then ep.can_update
              when 'delete' then ep.can_delete
              else false
            end
    );
$function$;

revoke all on function private.user_can_building(uuid, uuid, text) from public, anon;
grant execute on function private.user_can_building(uuid, uuid, text) to authenticated;

-- edifici
drop policy if exists edifici_update on public.edifici;
create policy edifici_update on public.edifici for update to authenticated
  using (private.user_can_resource(ente_id, 'edifici', 'update') and private.user_can_building(ente_id, id, 'update'))
  with check (private.user_can_resource(ente_id, 'edifici', 'update') and private.user_can_building(ente_id, id, 'update'));
drop policy if exists edifici_delete on public.edifici;
create policy edifici_delete on public.edifici for delete to authenticated
  using (private.user_can_resource(ente_id, 'edifici', 'delete') and private.user_can_building(ente_id, id, 'delete'));

-- impianti_manutentivi
drop policy if exists impianti_manutentivi_update on public.impianti_manutentivi;
drop policy if exists impianti_manutentivi_delete on public.impianti_manutentivi;
create policy impianti_manutentivi_update on public.impianti_manutentivi for update to authenticated
  using (private.user_can_resource(ente_id, 'impianti', 'update') and private.user_can_building(ente_id, edificio_id, 'update'))
  with check (private.user_can_resource(ente_id, 'impianti', 'update') and private.user_can_building(ente_id, edificio_id, 'update'));
create policy impianti_manutentivi_delete on public.impianti_manutentivi for delete to authenticated
  using (private.user_can_resource(ente_id, 'impianti', 'delete') and private.user_can_building(ente_id, edificio_id, 'delete'));

-- manutenzioni
drop policy if exists manutenzioni_update on public.manutenzioni;
create policy manutenzioni_update on public.manutenzioni for update to authenticated
  using (private.user_can_resource(ente_id, 'manutenzioni', 'update') and private.user_can_building(ente_id, edificio_id, 'update'))
  with check (private.user_can_resource(ente_id, 'manutenzioni', 'update') and private.user_can_building(ente_id, edificio_id, 'update'));
drop policy if exists manutenzioni_delete on public.manutenzioni;
create policy manutenzioni_delete on public.manutenzioni for delete to authenticated
  using (private.user_can_resource(ente_id, 'manutenzioni', 'delete') and private.user_can_building(ente_id, edificio_id, 'delete'));

-- edifici_permessi: auth.uid() valutato una sola volta per query (advisor auth_rls_initplan)
drop policy if exists edifici_permessi_manage on public.edifici_permessi;
create policy edifici_permessi_manage on public.edifici_permessi for all to authenticated
  using (exists (select 1 from public.user_roles ur
                 where ur.user_id = (select auth.uid()) and ur.ente_id = edifici_permessi.ente_id
                   and ur.ruolo in ('superadmin', 'admin_ente')))
  with check (exists (select 1 from public.user_roles ur
                 where ur.user_id = (select auth.uid()) and ur.ente_id = edifici_permessi.ente_id
                   and ur.ruolo in ('superadmin', 'admin_ente')));
drop policy if exists edifici_permessi_select on public.edifici_permessi;
create policy edifici_permessi_select on public.edifici_permessi for select to authenticated
  using (user_id = (select auth.uid())
         or exists (select 1 from public.user_roles ur
                    where ur.user_id = (select auth.uid()) and ur.ente_id = edifici_permessi.ente_id));

create index if not exists idx_edifici_permessi_ente_user on public.edifici_permessi (ente_id, user_id);
