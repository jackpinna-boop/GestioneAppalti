-- Correzione del trigger di limitazione: nei trigger BEFORE la colonna generata
-- codice_richiesta (derivata da numero_progressivo, che resta controllato) non
-- è ancora calcolata in NEW e risultava sempre "modificata", bloccando anche
-- la semplice risoluzione. La si esclude dal confronto.
create or replace function private.richieste_intervento_limita_risoluzione()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_campi_ammessi text[] := array['risolto', 'data_risoluzione', 'note_risoluzione', 'stato_risoluzione', 'updated_at', 'codice_richiesta'];
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
