-- Conteggi per la pagina Fascicoli (una riga per edificio) in un'unica query,
-- al posto delle 6 query di conteggio per edificio eseguite dal frontend.
-- security_invoker: ogni sottoquery rispetta le policy RLS dell'utente,
-- quindi i numeri coincidono con quelli che l'utente otterrebbe interrogando
-- le singole tabelle. Stessa semantica della pagina attuale
-- (interventi contati su interventi.edificio_id), con le richieste annullate
-- separate da quelle aperte.
create or replace view public.v_fascicoli_edifici
with (security_invoker = true)
as
select
  e.id as edificio_id,
  e.ente_id,
  (select count(*) from public.interventi i where i.edificio_id = e.id) as interventi,
  (select count(*) from public.richieste_intervento_sedi s where s.edificio_id = e.id) as richieste,
  (select count(*) from public.richieste_intervento_sedi s join public.richieste_intervento r on r.id = s.richiesta_id
     where s.edificio_id = e.id and not r.risolto and r.stato_risoluzione <> 'annullata') as richieste_aperte,
  (select count(*) from public.richieste_intervento_sedi s join public.richieste_intervento r on r.id = s.richiesta_id
     where s.edificio_id = e.id and r.risolto) as richieste_chiuse,
  (select count(*) from public.richieste_intervento_sedi s join public.richieste_intervento r on r.id = s.richiesta_id
     where s.edificio_id = e.id and r.stato_risoluzione = 'annullata') as richieste_annullate,
  (select count(*) from public.manutenzioni m where m.edificio_id = e.id) as manutenzioni,
  (select count(*) from public.impianti_manutentivi im where im.edificio_id = e.id) as impianti
from public.edifici e;

revoke all on public.v_fascicoli_edifici from anon, public;
grant select on public.v_fascicoli_edifici to authenticated;
