create or replace function public.school_create_request_multi(
  p_ente_id uuid,
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
    p_note_immobile,current_date,auth.uid(),'aperta',coalesce(p_priorita,'ordinaria'),
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

revoke all on function public.school_create_request_multi(uuid,uuid[],text,text,text,text,text) from public,anon;
grant execute on function public.school_create_request_multi(uuid,uuid[],text,text,text,text,text) to authenticated;

create or replace function public.school_cancel_request(p_request_id uuid, p_motivazione text)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare v_ente uuid; v_edificio uuid; v_stato text;
begin
  if not public.is_school_portal_user(auth.uid()) then raise exception 'Utente non autorizzato'; end if;
  select r.ente_id,r.stato_risoluzione into v_ente,v_stato
  from public.richieste_intervento r
  where r.id=p_request_id and r.created_by=auth.uid() and public.school_user_has_request(auth.uid(),r.id)
  limit 1;
  if v_ente is null then raise exception 'Richiesta non trovata o non autorizzata'; end if;
  if lower(coalesce(v_stato,''))='risolta' then raise exception 'Le richieste con stato RISOLTA non possono essere annullate'; end if;
  if lower(coalesce(v_stato,''))='annullata' then raise exception 'La richiesta è già annullata'; end if;

  update public.richieste_intervento
  set stato_risoluzione='annullata',risolto=false,note_risoluzione=coalesce(p_motivazione,'Annullata dall''utente scolastico'),updated_at=now()
  where id=p_request_id;

  for v_edificio in
    select ris.edificio_id from public.richieste_intervento_sedi ris where ris.richiesta_id=p_request_id
  loop
    insert into public.scuola_access_log(user_id,ente_id,edificio_id,richiesta_id,azione,metadata)
    values(auth.uid(),v_ente,v_edificio,p_request_id,'ANNULLAMENTO_RICHIESTA',jsonb_build_object('motivazione',p_motivazione));
  end loop;
  return true;
end;
$function$;

revoke all on function public.school_cancel_request(uuid,text) from public,anon;
grant execute on function public.school_cancel_request(uuid,text) to authenticated;