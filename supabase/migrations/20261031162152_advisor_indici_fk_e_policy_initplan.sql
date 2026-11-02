-- Correzioni da advisor Supabase (performance), a basso rischio.
--
-- 1. Indici sulle 32 foreign key senza indice di copertura (unindexed_foreign_keys).
-- 2. Policy RLS che rivalutavano auth.uid() per ogni riga: sostituito con
--    (select auth.uid()), valutato una volta per query (auth_rls_initplan).
--    Le espressioni sono identiche alle precedenti salvo questo wrapping.
-- 3. Rimossi tre indici unici duplicati: resta l'indice del vincolo UNIQUE
--    equivalente (duplicate_index).
--
-- Non modificati di proposito:
-- * funzioni SECURITY DEFINER eseguibili da authenticated: servono alle
--   policy RLS o sono RPC dell'applicazione con controlli interni;
-- * policy permissive multiple su SELECT (impatto trascurabile);
-- * indici "mai usati": il database è ancora poco popolato;
-- * richieste_import_chunks: RLS attiva senza policy (nessun accesso via API),
--   tabella vuota e non usata da codice o funzioni; lasciata com'è.

-- 1. Indici sulle foreign key
create index if not exists idx_documenti_immobile_created_by on public.documenti_immobile (created_by);
create index if not exists idx_documenti_immobile_ente_id on public.documenti_immobile (ente_id);
create index if not exists idx_impianti_manutentivi_created_by on public.impianti_manutentivi (created_by);
create index if not exists idx_impianti_termici_matricole_impianto_id on public.impianti_termici_matricole (impianto_id);
create index if not exists idx_import_batch_impianti_created_by on public.import_batch_impianti (created_by);
create index if not exists idx_import_batch_impianti_ente_id on public.import_batch_impianti (ente_id);
create index if not exists idx_import_righe_impianti_edificio_id on public.import_righe_impianti (edificio_id);
create index if not exists idx_interventi_edifici_ente_id on public.interventi_edifici (ente_id);
create index if not exists idx_interventi_edifici_quote_edificio_id on public.interventi_edifici_quote (edificio_id);
create index if not exists idx_interventi_edifici_quote_ente_id on public.interventi_edifici_quote (ente_id);
create index if not exists idx_manutenzione_documenti_created_by on public.manutenzione_documenti (created_by);
create index if not exists idx_manutenzione_documenti_ente_id on public.manutenzione_documenti (ente_id);
create index if not exists idx_manutenzioni_created_by on public.manutenzioni (created_by);
create index if not exists idx_permessi_utenti_user_id on public.permessi_utenti (user_id);
create index if not exists idx_permessi_utenti_risorse_user_id on public.permessi_utenti_risorse (user_id);
create index if not exists idx_richiesta_intervento_documenti_created_by on public.richiesta_intervento_documenti (created_by);
create index if not exists idx_richiesta_intervento_documenti_ente_id on public.richiesta_intervento_documenti (ente_id);
create index if not exists idx_richiesta_intervento_documenti_richiesta_id_ente_id on public.richiesta_intervento_documenti (richiesta_id, ente_id);
create index if not exists idx_richieste_intervento_created_by on public.richieste_intervento (created_by);
create index if not exists idx_richieste_intervento_allegati_created_by on public.richieste_intervento_allegati (created_by);
create index if not exists idx_richieste_intervento_ambiti_ambito_id on public.richieste_intervento_ambiti (ambito_id);
create index if not exists idx_richieste_intervento_ambiti_ente_id on public.richieste_intervento_ambiti (ente_id);
create index if not exists idx_richieste_intervento_ambiti_richiesta_id_ente_id on public.richieste_intervento_ambiti (richiesta_id, ente_id);
create index if not exists idx_richieste_intervento_sedi_edificio_id_ente_id on public.richieste_intervento_sedi (edificio_id, ente_id);
create index if not exists idx_richieste_intervento_sedi_ente_id on public.richieste_intervento_sedi (ente_id);
create index if not exists idx_richieste_intervento_sedi_richiesta_id_ente_id on public.richieste_intervento_sedi (richiesta_id, ente_id);
create index if not exists idx_scuola_access_log_edificio_id on public.scuola_access_log (edificio_id);
create index if not exists idx_scuola_access_log_ente_id on public.scuola_access_log (ente_id);
create index if not exists idx_scuola_access_log_scuola_id on public.scuola_access_log (scuola_id);
create index if not exists idx_scuola_utenti_edifici_edificio_id on public.scuola_utenti_edifici (edificio_id);
create index if not exists idx_scuole_edifici_edificio_id on public.scuole_edifici (edificio_id);
create index if not exists idx_valori_attributi_impianto_attributo_id on public.valori_attributi_impianto (attributo_id);

-- 2. auth.uid() valutato una volta per query
alter policy ambiti_richiesta_intervento_delete on public.ambiti_richiesta_intervento
  using ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy ambiti_richiesta_intervento_insert on public.ambiti_richiesta_intervento
  with check ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy ambiti_richiesta_intervento_update on public.ambiti_richiesta_intervento
  using ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))))
  with check ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy audit_select on public.audit_log
  using ((is_superadmin() OR ((NOT is_school_portal_user((select auth.uid()))) AND can_access_ente(ente_id)) OR (is_school_portal_user((select auth.uid())) AND (intervento_id IS NULL) AND (record_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM richieste_intervento r
  WHERE ((r.id = audit_log.record_id) AND school_user_has_request((select auth.uid()), r.id)))))));
alter policy edifici_select on public.edifici
  using ((((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'edifici'::text, 'view'::text)) OR (is_school_portal_user((select auth.uid())) AND school_user_has_building((select auth.uid()), id))));
alter policy richieste_intervento_delete on public.richieste_intervento
  using (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'delete'::text)));
alter policy richieste_intervento_insert on public.richieste_intervento
  with check (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'create'::text)));
alter policy richieste_intervento_select on public.richieste_intervento
  using ((((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'view'::text)) OR (is_school_portal_user((select auth.uid())) AND school_user_has_request((select auth.uid()), id))));
alter policy richieste_intervento_update on public.richieste_intervento
  using (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text)))
  with check (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text)));
alter policy school_allegati_insert on public.richieste_intervento_allegati
  with check (((created_by = (select auth.uid())) AND school_user_has_request((select auth.uid()), richiesta_id) AND (mime_type = ANY (ARRAY['application/pdf'::text, 'image/jpeg'::text, 'image/png'::text, 'image/gif'::text, 'image/webp'::text, 'image/bmp'::text, 'image/tiff'::text])) AND ((dimensione_bytes >= 1) AND (dimensione_bytes <= 5242880))));
alter policy school_allegati_select on public.richieste_intervento_allegati
  using (school_user_has_request((select auth.uid()), richiesta_id));
alter policy richieste_intervento_sedi_delete on public.richieste_intervento_sedi
  using (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'delete'::text)));
alter policy richieste_intervento_sedi_insert on public.richieste_intervento_sedi
  with check (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'create'::text)));
alter policy richieste_intervento_sedi_select on public.richieste_intervento_sedi
  using ((((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'view'::text)) OR (is_school_portal_user((select auth.uid())) AND school_user_has_building((select auth.uid()), edificio_id))));
alter policy richieste_intervento_sedi_update on public.richieste_intervento_sedi
  using (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text)))
  with check (((NOT is_school_portal_user((select auth.uid()))) AND private.user_can_resource(ente_id, 'richieste'::text, 'update'::text)));
alter policy scuola_access_log_insert on public.scuola_access_log
  with check (((user_id = (select auth.uid())) AND is_school_portal_user((select auth.uid()))));
alter policy scuola_access_log_select on public.scuola_access_log
  using ((is_superadmin() OR ((user_id = (select auth.uid())) AND is_school_portal_user((select auth.uid()))) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ente_id = scuola_access_log.ente_id) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy scuola_utenti_delete on public.scuola_utenti
  using (( SELECT private.school_admin_can_manage_school(scuola_utenti.scuola_id, (select auth.uid())) AS school_admin_can_manage_school));
alter policy scuola_utenti_insert on public.scuola_utenti
  with check (( SELECT private.school_admin_can_manage_school(scuola_utenti.scuola_id, (select auth.uid())) AS school_admin_can_manage_school));
alter policy scuola_utenti_select on public.scuola_utenti
  using (( SELECT private.school_user_can_view(scuola_utenti.id, (select auth.uid())) AS school_user_can_view));
alter policy scuola_utenti_update on public.scuola_utenti
  using (( SELECT private.school_admin_can_manage_school(scuola_utenti.scuola_id, (select auth.uid())) AS school_admin_can_manage_school))
  with check (( SELECT private.school_admin_can_manage_school(scuola_utenti.scuola_id, (select auth.uid())) AS school_admin_can_manage_school));
alter policy scuola_utenti_edifici_manage on public.scuola_utenti_edifici
  using (( SELECT private.school_user_admin_can_manage(scuola_utenti_edifici.scuola_utente_id, (select auth.uid())) AS school_user_admin_can_manage))
  with check ((( SELECT private.school_user_admin_can_manage(scuola_utenti_edifici.scuola_utente_id, (select auth.uid())) AS school_user_admin_can_manage) AND (EXISTS ( SELECT 1
   FROM scuola_utenti su
  WHERE ((su.id = scuola_utenti_edifici.scuola_utente_id) AND ( SELECT private.school_building_belongs(su.scuola_id, scuola_utenti_edifici.edificio_id) AS school_building_belongs))))));
alter policy scuola_utenti_edifici_select on public.scuola_utenti_edifici
  using ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM scuola_utenti su
  WHERE ((su.id = scuola_utenti_edifici.scuola_utente_id) AND (su.user_id = (select auth.uid())) AND su.attivo))) OR ( SELECT private.school_user_admin_can_manage(scuola_utenti_edifici.scuola_utente_id, (select auth.uid())) AS school_user_admin_can_manage)));
alter policy scuole_manage on public.scuole
  using ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ente_id = scuole.ente_id) AND (ur.ruolo = 'admin_ente'::app_role))))))
  with check ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ente_id = scuole.ente_id) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy scuole_select on public.scuole
  using ((is_superadmin() OR ( SELECT private.school_has_user(scuole.id, (select auth.uid())) AS school_has_user) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = (select auth.uid())) AND (ur.ente_id = scuole.ente_id) AND (ur.ruolo = ANY (ARRAY['admin_ente'::app_role, 'superadmin'::app_role])))))));
alter policy scuole_edifici_manage on public.scuole_edifici
  using ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN scuole s ON ((s.ente_id = ur.ente_id)))
  WHERE ((s.id = scuole_edifici.scuola_id) AND (ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))))
  with check ((is_superadmin() OR (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN scuole s ON ((s.ente_id = ur.ente_id)))
  WHERE ((s.id = scuole_edifici.scuola_id) AND (ur.user_id = (select auth.uid())) AND (ur.ruolo = 'admin_ente'::app_role))))));
alter policy scuole_edifici_select on public.scuole_edifici
  using ((is_superadmin() OR ( SELECT private.school_has_user(scuole_edifici.scuola_id, (select auth.uid())) AS school_has_user) OR (EXISTS ( SELECT 1
   FROM (user_roles ur
     JOIN scuole s ON ((s.ente_id = ur.ente_id)))
  WHERE ((s.id = scuole_edifici.scuola_id) AND (ur.user_id = (select auth.uid())) AND (ur.ruolo = ANY (ARRAY['admin_ente'::app_role, 'superadmin'::app_role])))))));

-- 3. Indici duplicati (resta l'indice del vincolo UNIQUE equivalente)
drop index if exists public.uq_edifici_ente_codice;
drop index if exists public.uq_tipologie_impianto_ente_codice;
drop index if exists public.uq_attributi_tipologia_impianto_codice;
