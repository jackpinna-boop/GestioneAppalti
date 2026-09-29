-- Portale Scuola: annullamento non distruttivo delle richieste.
-- Un utente autorizzato può annullare una richiesta APERTA appartenente al proprio perimetro scolastico.
-- La richiesta non viene eliminata: assume lo stato ANNULLATA/SOVRASCRITTA.

create or replace function public.school_cancel_request(p_request_id uuid, p_motivazione text)
returns boolean
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_ente uuid;
  v_edificio uuid;
  v_stato text;
begin
  if not public.is_school_portal_user(auth.uid()) then
    raise exception 'Utente non autorizzato';
  end if;

  select r.ente_id, r.stato_risoluzione
    into v_ente, v_stato
  from public.richieste_intervento r
  where r.id = p_request_id
    and public.school_user_has_request(auth.uid(), r.id)
  limit 1;

  if v_ente is null then
    raise exception 'Richiesta non trovata o non autorizzata';
  end if;

  if lower(coalesce(v_stato,'')) <> 'aperta' then
    if lower(coalesce(v_stato,'')) = 'risolta' then
      raise exception 'Le richieste con stato RISOLTA non possono essere annullate';
    elsif lower(coalesce(v_stato,'')) like 'annullata%' then
      raise exception 'La richiesta è già annullata';
    else
      raise exception 'È possibile annullare solo le richieste in stato APERTA';
    end if;
  end if;

  update public.richieste_intervento
  set
    stato_risoluzione = 'ANNULLATA/SOVRASCRITTA',
    risolto = false,
    note_risoluzione = coalesce(p_motivazione, 'Annullata dall''utente scolastico'),
    updated_at = now()
  where id = p_request_id;

  for v_edificio in
    select ris.edificio_id
    from public.richieste_intervento_sedi ris
    where ris.richiesta_id = p_request_id
  loop
    insert into public.scuola_access_log(
      user_id, ente_id, edificio_id, richiesta_id, azione, metadata
    )
    values(
      auth.uid(),
      v_ente,
      v_edificio,
      p_request_id,
      'ANNULLAMENTO_RICHIESTA',
      jsonb_build_object(
        'motivazione', p_motivazione,
        'stato_finale', 'ANNULLATA/SOVRASCRITTA',
        'non_eliminata', true
      )
    );
  end loop;

  return true;
end;
$function$;

revoke all on function public.school_cancel_request(uuid,text) from public, anon;
grant execute on function public.school_cancel_request(uuid,text) to authenticated;
