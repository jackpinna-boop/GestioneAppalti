-- Portale Scuola: creazione richiesta vincolata alla scuola selezionata.
-- La scuola deve essere associata all'utente e tutti gli edifici selezionati
-- devono appartenere a quella scuola e al perimetro autorizzato dell'utente.

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
set search_path = public
as $function$
declare
  v_id uuid;
  v_edificio uuid;
begin
  if not public.is_school_portal_user(auth.uid()) then
    raise exception 'Utente non autorizzato al Portale Scuola';
  end if;

  if p_scuola_id is null then
    raise exception 'Selezionare una scuola';
  end if;

  if not exists (
    select 1
    from public.scuola_utenti su
    join public.scuole s on s.id=su.scuola_id
    where su.user_id=auth.uid()
      and su.scuola_id=p_scuola_id
      and su.attivo
      and s.attiva
      and su.ruolo in ('dirigente_scolastico','delegato_scolastico')
      and (su.data_fine is null or su.data_fine>=current_date)
  ) then
    raise exception 'La scuola selezionata non è associata al tuo utente';
  end if;

  if p_edificio_ids is null or cardinality(p_edificio_ids)=0 then
    raise exception 'Selezionare almeno un edificio';
  end if;

  foreach v_edificio in array p_edificio_ids loop
    if not public.school_user_has_building(auth.uid(),v_edificio) then
      raise exception 'Uno degli edifici selezionati non è autorizzato per questo utente';
    end if;

    if not exists (
      select 1
      from public.scuole_edifici se
      where se.scuola_id=p_scuola_id
        and se.edificio_id=v_edificio
        and se.attivo
    ) then
      raise exception 'Uno degli edifici selezionati non appartiene alla scuola indicata';
    end if;

    if not exists(
      select 1 from public.edifici e
      where e.id=v_edificio and e.ente_id=p_ente_id
    ) then
      raise exception 'Uno degli edifici selezionati non appartiene all''ente indicato';
    end if;
  end loop;

  insert into public.richieste_intervento(
    ente_id,titolo_sintetico,descrizione_estesa,tipo_intervento,risolto,data_risoluzione,
    note_immobile,data_richiesta,created_by,stato_risoluzione,priorita,allegati_presenti,
    edificio_origine,origine_sistema
  ) values (
    p_ente_id,p_titolo,p_descrizione,coalesce(p_tipo_intervento,'ordinaria'),false,null,
    p_note_immobile,current_date,auth.uid(),'aperta',coalesce(p_priorita,'ordinaria'),
    false,null,'PORTALE_SCUOLA'
  ) returning id into v_id;

  insert into public.richieste_intervento_sedi(ente_id,richiesta_id,edificio_id)
  select p_ente_id,v_id,x from unnest(p_edificio_ids) x
  on conflict do nothing;

  foreach v_edificio in array p_edificio_ids loop
    insert into public.scuola_access_log(
      user_id,ente_id,edificio_id,richiesta_id,scuola_id,azione,metadata
    )
    values(
      auth.uid(),p_ente_id,v_edificio,v_id,p_scuola_id,'CREAZIONE_RICHIESTA',
      jsonb_build_object(
        'origine','PORTALE_SCUOLA',
        'scuola_id',p_scuola_id,
        'segnalazione_multi_edificio',true
      )
    );
  end loop;

  return v_id;
end;
$function$;

revoke all on function public.school_create_request_multi_school(uuid,uuid,uuid[],text,text,text,text,text) from public,anon;
grant execute on function public.school_create_request_multi_school(uuid,uuid,uuid[],text,text,text,text,text) to authenticated;
