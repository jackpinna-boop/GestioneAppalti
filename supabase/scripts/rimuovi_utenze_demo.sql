-- Rimozione delle utenze di prova (app_metadata.demo = true).
-- Da eseguire a fine collaudo/presentazione (SQL editor di Supabase o tool MCP).
-- Non tocca utenti reali: seleziona solo gli account marcati demo.
-- Le richieste, manutenzioni e altri dati creati durante i test restano
-- (created_by non ha vincoli); il registro modifiche conserva le operazioni
-- con user_id azzerato.

begin;

create temporary table _demo on commit drop as
  select id from auth.users where raw_app_meta_data->>'demo' = 'true';

-- Deleghe e assegnazioni del Portale Scuola
delete from public.scuola_utenti_edifici
 where scuola_utente_id in (select id from public.scuola_utenti where user_id in (select id from _demo));
delete from public.scuola_utenti where user_id in (select id from _demo);

-- Ruoli e permessi personali
delete from public.user_roles where user_id in (select id from _demo);
delete from public.permessi_utenti where user_id in (select id from _demo);

-- Allegati del portale caricati dalle utenze di prova (vincolo senza cascata).
-- I file nel bucket "richieste-intervento" vanno eventualmente rimossi dallo Storage.
delete from public.richieste_intervento_allegati where created_by in (select id from _demo);

-- Account (cascata su profiles, identities, sessioni, fattori MFA,
-- permessi_utenti_risorse, edifici_permessi; audit_log.user_id -> null)
delete from auth.users where id in (select id from _demo);

select count(*) as utenze_demo_rimaste from auth.users where raw_app_meta_data->>'demo' = 'true';

commit;
