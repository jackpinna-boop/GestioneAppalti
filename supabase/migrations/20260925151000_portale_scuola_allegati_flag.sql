create or replace function public.school_mark_request_attachments(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $function$
begin
  if not public.school_user_has_request(auth.uid(),p_request_id) then
    raise exception 'Richiesta non autorizzata';
  end if;
  update public.richieste_intervento
  set allegati_presenti=true, updated_at=now()
  where id=p_request_id;
end;
$function$;

revoke all on function public.school_mark_request_attachments(uuid) from public;
grant execute on function public.school_mark_request_attachments(uuid) to authenticated;