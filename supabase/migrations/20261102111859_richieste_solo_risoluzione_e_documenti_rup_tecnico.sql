-- Richieste di intervento: decisioni dell'ente sui ruoli operativi.
--
-- 1. Manutentore e Società in House (siservizi) possono solo risolvere le
--    richieste e compilare le note di intervento: un trigger BEFORE UPDATE su
--    richieste_intervento rifiuta, per chi nell'ente ha soltanto questi ruoli,
--    modifiche a colonne diverse da risolto, data_risoluzione, note_risoluzione,
--    stato_risoluzione, updated_at. Sedi e ambiti della richiesta: per questi
--    ruoli niente modifiche (insert/delete erano già negati dalla matrice,
--    l'update ora è negato dalla policy).
--    Chi ha anche un altro ruolo gestionale nell'ente (admin_ente, rup,
--    tecnico, ...) o è superadmin non è limitato. Le operazioni senza utente
--    autenticato (service role, migrazioni) non sono limitate.
-- 2. RUP e tecnico possono allegare documenti alle richieste
--    (permessi_ruoli.can_documents per la risorsa 'richieste'); le policy della
--    tabella richiesta_intervento_documenti e del bucket documenti/richieste/
--    usano già il permesso 'documents'.

-- 1a. Utente limitato alla sola risoluzione nell'ente
create or replace function private.richieste_solo_risoluzione(p_ente_id uuid)
returns boolean
language sql
stable
security definer
set search_path to ''
as $function$
  select exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.ente_id = p_ente_id
    )
    and not exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and (ur.ruolo = 'superadmin'
             or (ur.ente_id = p_ente_id and ur.ruolo not in ('manutentore', 'siservizi')))
    );
$function$;

revoke all on function private.richieste_solo_risoluzione(uuid) from public, anon;
grant execute on function private.richieste_solo_risoluzione(uuid) to authenticated;

-- 1b. Trigger: solo i campi di risoluzione sono modificabili
create or replace function private.richieste_intervento_limita_risoluzione()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_campi_ammessi text[] := array['risolto', 'data_risoluzione', 'note_risoluzione', 'stato_risoluzione', 'updated_at'];
begin
  if (select auth.uid()) is null then
    return new;
  end if;
  if not private.richieste_solo_risoluzione(old.ente_id) then
    return new;
  end if;
  if (to_jsonb(new) - v_campi_ammessi) is distinct from (to_jsonb(old) - v_campi_ammessi) then
    raise exception 'Con il ruolo di manutentore o Società in House è possibile solo risolvere la richiesta e compilare le note di intervento: gli altri dati della richiesta non sono modificabili.'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$function$;

drop trigger if exists trg_richieste_intervento_limita_risoluzione on public.richieste_intervento;
create trigger trg_richieste_intervento_limita_risoluzione
  before update on public.richieste_intervento
  for each row execute function private.richieste_intervento_limita_risoluzione();

-- 1c. Sedi e ambiti: niente modifiche per i ruoli limitati
alter policy richieste_intervento_sedi_update on public.richieste_intervento_sedi
  using (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text) AND (NOT private.richieste_solo_risoluzione(ente_id))))
  with check (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text) AND (NOT private.richieste_solo_risoluzione(ente_id))));
alter policy richieste_intervento_ambiti_update on public.richieste_intervento_ambiti
  using ((private.user_can_resource(ente_id, 'richieste'::text, 'update'::text) AND (NOT private.richieste_solo_risoluzione(ente_id))))
  with check ((private.user_can_resource(ente_id, 'richieste'::text, 'update'::text) AND (NOT private.richieste_solo_risoluzione(ente_id))));

-- 2. RUP e tecnico: documenti sulle richieste
update public.permessi_ruoli
set can_documents = true
where risorsa = 'richieste'
  and ruolo in ('rup', 'tecnico')
  and can_documents is distinct from true;
