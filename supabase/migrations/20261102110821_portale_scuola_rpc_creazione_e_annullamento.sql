-- Portale Scuola: allinea il database a quanto usa src/SchoolPortalPage.tsx.
--
-- Problemi rilevati (nessuna richiesta del portale presente, nessun dato toccato):
-- * la RPC public.school_create_request_multi_school, chiamata dal portale per
--   creare una segnalazione, non esisteva (migrazione 20260929094500 presente
--   nel repository ma mai applicata);
-- * il portale invia priorità ordinaria/urgente/emergenza, mentre il vincolo
--   richieste_intervento_priorita_ck ammette solo
--   programmabile/non_urgente/media/urgente: la RPC ora normalizza
--   (ordinaria -> media, emergenza -> urgente) e conserva il valore
--   originale nel registro accessi;
-- * school_cancel_request impostava stato_risoluzione='annullata', valore non
--   ammesso dal vincolo richieste_intervento_stato_risoluzione_ck: il vincolo
--   ora ammette anche 'annullata'. L'annullamento segue la regola della
--   migrazione 20260929090000 (mai applicata): qualunque richiesta del proprio
--   perimetro scolastico, solo se in stato aperta, senza cancellarla.

-- 1. Stato 'annullata' ammesso
alter table public.richieste_intervento
  drop constraint richieste_intervento_stato_risoluzione_ck;
alter table public.richieste_intervento
  add constraint richieste_intervento_stato_risoluzione_ck
  check (stato_risoluzione = any (array['aperta'::text, 'risolta'::text, 'da_valutare'::text, 'annullata'::text]));

-- 2. Normalizzazione priorità del portale
create or replace function private.school_priorita(p_priorita text)
returns text
language sql
immutable
set search_path to ''
as $function$
  select case lower(coalesce(nullif(trim(p_priorita), ''), 'ordinaria'))
    when 'ordinaria' then 'media'
    when 'emergenza' then 'urgente'
    when 'programmabile' then 'programmabile'
    when 'non_urgente' then 'non_urgente'
    when 'media' then 'media'
    when 'urgente' then 'urgente'
    else 'media'
  end;
$function$;

-- 3. Creazione richiesta vincolata alla scuola selezionata
create or replace function public.school_create_request_multi_school(
  p_ente_id uuid,
  p_scuola_id uuid,
  p_edificio_ids uuid[],
  p_titolo text,
  p_descrizione text,
  p_tipo_intervento text default 'ordinaria',
  p_priorita text default 'ordinaria',
  p_note_immobile text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_edificio uuid;
  v_uid uuid := auth.uid();
begin
  if not public.is_school_portal_user(v_uid) then
    raise exception 'Utente non autorizzato al Portale Scuola';
  end if;

  if p_scuola_id is null then
    raise exception 'Selezionare una scuola';
  end if;

  if not exists (
    select 1
    from public.scuola_utenti su
    join public.scuole s on s.id = su.scuola_id
    where su.user_id = v_uid
      and su.scuola_id = p_scuola_id
      and su.attivo
      and s.attiva
      and s.ente_id = p_ente_id
      and su.ruolo in ('dirigente_scolastico','delegato_scolastico')
      and (su.data_fine is null or su.data_fine >= current_date)
  ) then
    raise exception 'La scuola selezionata non è associata al tuo utente';
  end if;

  if p_edificio_ids is null or cardinality(p_edificio_ids) = 0 then
    raise exception 'Selezionare almeno un edificio';
  end if;

  if nullif(trim(coalesce(p_titolo, '')), '') is null then
    raise exception 'Il titolo è obbligatorio';
  end if;

  foreach v_edificio in array p_edificio_ids loop
    if not public.school_user_has_building(v_uid, v_edificio) then
      raise exception 'Uno degli edifici selezionati non è autorizzato per questo utente';
    end if;
    if not exists (
      select 1 from public.scuole_edifici se
      where se.scuola_id = p_scuola_id and se.edificio_id = v_edificio and se.attivo
    ) then
      raise exception 'Uno degli edifici selezionati non appartiene alla scuola indicata';
    end if;
    if not exists (
      select 1 from public.edifici e where e.id = v_edificio and e.ente_id = p_ente_id
    ) then
      raise exception 'Uno degli edifici selezionati non appartiene all''ente indicato';
    end if;
  end loop;

  insert into public.richieste_intervento(
    ente_id, titolo_sintetico, descrizione_estesa, tipo_intervento, risolto, data_risoluzione,
    note_immobile, data_richiesta, created_by, stato_risoluzione, priorita, allegati_presenti,
    edificio_origine, origine_sistema
  ) values (
    p_ente_id, p_titolo, p_descrizione,
    case when p_tipo_intervento in ('ordinaria','straordinaria','da_valutare') then p_tipo_intervento else 'ordinaria' end,
    false, null, p_note_immobile, current_date, v_uid, 'aperta',
    private.school_priorita(p_priorita), false, null, 'PORTALE_SCUOLA'
  ) returning id into v_id;

  insert into public.richieste_intervento_sedi(ente_id, richiesta_id, edificio_id)
  select distinct p_ente_id, v_id, x from unnest(p_edificio_ids) x
  on conflict do nothing;

  foreach v_edificio in array p_edificio_ids loop
    insert into public.scuola_access_log(
      user_id, ente_id, edificio_id, richiesta_id, scuola_id, azione, metadata
    ) values (
      v_uid, p_ente_id, v_edificio, v_id, p_scuola_id, 'CREAZIONE_RICHIESTA',
      jsonb_build_object(
        'origine', 'PORTALE_SCUOLA',
        'scuola_id', p_scuola_id,
        'priorita_portale', p_priorita,
        'segnalazione_multi_edificio', cardinality(p_edificio_ids) > 1
      )
    );
  end loop;

  return v_id;
end;
$function$;

revoke all on function public.school_create_request_multi_school(uuid,uuid,uuid[],text,text,text,text,text) from public, anon;
grant execute on function public.school_create_request_multi_school(uuid,uuid,uuid[],text,text,text,text,text) to authenticated;

-- 4. Annullamento non distruttivo (solo richieste aperte del proprio perimetro)
create or replace function public.school_cancel_request(p_request_id uuid, p_motivazione text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_ente uuid;
  v_edificio uuid;
  v_stato text;
  v_uid uuid := auth.uid();
begin
  if not public.is_school_portal_user(v_uid) then
    raise exception 'Utente non autorizzato';
  end if;

  select r.ente_id, r.stato_risoluzione into v_ente, v_stato
  from public.richieste_intervento r
  where r.id = p_request_id
    and public.school_user_has_request(v_uid, r.id)
  limit 1;

  if v_ente is null then
    raise exception 'Richiesta non trovata o non autorizzata';
  end if;

  if lower(coalesce(v_stato, '')) <> 'aperta' then
    if lower(coalesce(v_stato, '')) = 'risolta' then
      raise exception 'Le richieste con stato RISOLTA non possono essere annullate';
    elsif lower(coalesce(v_stato, '')) like 'annullata%' then
      raise exception 'La richiesta è già annullata';
    else
      raise exception 'È possibile annullare solo le richieste in stato APERTA';
    end if;
  end if;

  update public.richieste_intervento
  set stato_risoluzione = 'annullata',
      risolto = false,
      note_risoluzione = coalesce(p_motivazione, 'Annullata dall''utente scolastico'),
      updated_at = now()
  where id = p_request_id;

  for v_edificio in
    select ris.edificio_id from public.richieste_intervento_sedi ris where ris.richiesta_id = p_request_id
  loop
    insert into public.scuola_access_log(user_id, ente_id, edificio_id, richiesta_id, azione, metadata)
    values (v_uid, v_ente, v_edificio, p_request_id, 'ANNULLAMENTO_RICHIESTA',
      jsonb_build_object('motivazione', p_motivazione, 'stato_finale', 'annullata', 'non_eliminata', true));
  end loop;

  return true;
end;
$function$;

revoke all on function public.school_cancel_request(uuid,text) from public, anon;
grant execute on function public.school_cancel_request(uuid,text) to authenticated;
