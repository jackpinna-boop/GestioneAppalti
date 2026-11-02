-- Portale Scuola: stati, priorità predefinite e lettura allegati da parte del personale.
--
-- 1. richieste_intervento_stato_risoluzione_ck ammette anche 'in_carico'
--    (contatore del portale) oltre a 'annullata'.
-- 2. Priorità predefinita 'media' (valore ammesso da richieste_intervento_priorita_ck)
--    in tutte le RPC school_create_request*: le versioni precedenti usavano
--    'ordinaria', che violava il vincolo. Il valore ricevuto passa comunque da
--    private.school_priorita (ordinaria -> media, emergenza -> urgente).
-- 3. Allegati del portale leggibili dal personale dell'ente con permesso
--    'richieste' / 'view' (tabella richieste_intervento_allegati e bucket
--    richieste-intervento). Le policy dei referenti scolastici restano invariate.

-- 1. Stati ammessi
alter table public.richieste_intervento
  drop constraint richieste_intervento_stato_risoluzione_ck;
alter table public.richieste_intervento
  add constraint richieste_intervento_stato_risoluzione_ck
  check (stato_risoluzione = any (array['aperta'::text, 'risolta'::text, 'da_valutare'::text, 'annullata'::text, 'in_carico'::text]));

-- 2. Priorità predefinita 'media'
create or replace function public.school_create_request_multi_school(
  p_ente_id uuid,
  p_scuola_id uuid,
  p_edificio_ids uuid[],
  p_titolo text,
  p_descrizione text,
  p_tipo_intervento text default 'ordinaria',
  p_priorita text default 'media',
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

-- Versioni precedenti (non più usate dal frontend): stessa logica, priorità
-- normalizzata e default 'media'.
create or replace function public.school_create_request(p_ente_id uuid, p_edificio_id uuid, p_titolo text, p_descrizione text, p_tipo_intervento text default 'ordinaria', p_priorita text default 'media', p_note_immobile text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare v_id uuid;
begin
  if not public.is_school_portal_user(auth.uid()) then raise exception 'Utente non autorizzato al Portale Scuola'; end if;
  if not public.school_user_has_building(auth.uid(),p_edificio_id) then raise exception 'Edificio non autorizzato per questo utente'; end if;
  if not exists(select 1 from public.edifici e where e.id=p_edificio_id and e.ente_id=p_ente_id) then raise exception 'Edificio non appartenente all''ente indicato'; end if;
  insert into public.richieste_intervento(
    ente_id,titolo_sintetico,descrizione_estesa,tipo_intervento,risolto,data_risoluzione,note_immobile,data_richiesta,
    created_by,stato_risoluzione,priorita,allegati_presenti,edificio_origine,origine_sistema
  ) values (
    p_ente_id,p_titolo,p_descrizione,coalesce(p_tipo_intervento,'ordinaria'),false,null,p_note_immobile,current_date,
    auth.uid(),'aperta',private.school_priorita(p_priorita),false,null,'PORTALE_SCUOLA'
  ) returning id into v_id;
  insert into public.richieste_intervento_sedi(ente_id,richiesta_id,edificio_id)
  values(p_ente_id,v_id,p_edificio_id);
  insert into public.scuola_access_log(user_id,ente_id,edificio_id,richiesta_id,azione,metadata)
  values(auth.uid(),p_ente_id,p_edificio_id,v_id,'CREAZIONE_RICHIESTA',jsonb_build_object('origine','PORTALE_SCUOLA'));
  return v_id;
end;
$function$;

create or replace function public.school_create_request_multi(p_ente_id uuid, p_edificio_ids uuid[], p_titolo text, p_descrizione text, p_tipo_intervento text default 'ordinaria', p_priorita text default 'media', p_note_immobile text default null)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_id uuid;
  v_edificio uuid;
begin
  if not public.is_school_portal_user(auth.uid()) then
    raise exception 'Utente non autorizzato al Portale Scuola';
  end if;
  if p_edificio_ids is null or cardinality(p_edificio_ids)=0 then
    raise exception 'Selezionare almeno un edificio';
  end if;

  foreach v_edificio in array p_edificio_ids loop
    if not public.school_user_has_building(auth.uid(),v_edificio) then
      raise exception 'Uno degli edifici selezionati non è autorizzato per questo utente';
    end if;
    if not exists(select 1 from public.edifici e where e.id=v_edificio and e.ente_id=p_ente_id) then
      raise exception 'Uno degli edifici selezionati non appartiene all''ente indicato';
    end if;
  end loop;

  insert into public.richieste_intervento(
    ente_id,titolo_sintetico,descrizione_estesa,tipo_intervento,risolto,data_risoluzione,
    note_immobile,data_richiesta,created_by,stato_risoluzione,priorita,allegati_presenti,
    edificio_origine,origine_sistema
  ) values (
    p_ente_id,p_titolo,p_descrizione,coalesce(p_tipo_intervento,'ordinaria'),false,null,
    p_note_immobile,current_date,auth.uid(),'aperta',private.school_priorita(p_priorita),
    false,null,'PORTALE_SCUOLA'
  ) returning id into v_id;

  insert into public.richieste_intervento_sedi(ente_id,richiesta_id,edificio_id)
  select p_ente_id,v_id,x from unnest(p_edificio_ids) x
  on conflict do nothing;

  foreach v_edificio in array p_edificio_ids loop
    insert into public.scuola_access_log(user_id,ente_id,edificio_id,richiesta_id,azione,metadata)
    values(auth.uid(),p_ente_id,v_edificio,v_id,'CREAZIONE_RICHIESTA',
      jsonb_build_object('origine','PORTALE_SCUOLA','segnalazione_multi_edificio',true));
  end loop;
  return v_id;
end;
$function$;

-- 3. Allegati leggibili dal personale dell'ente
create policy staff_allegati_select on public.richieste_intervento_allegati
  for select to authenticated
  using (exists (
    select 1 from public.richieste_intervento r
    where r.id = richieste_intervento_allegati.richiesta_id
      and private.user_can_resource(r.ente_id, 'richieste', 'view')
  ));

create policy staff_request_files_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'richieste-intervento'
    and exists (
      select 1 from public.richieste_intervento r
      where r.id::text = split_part(objects.name, '/', 1)
        and private.user_can_resource(r.ente_id, 'richieste', 'view')
    )
  );
