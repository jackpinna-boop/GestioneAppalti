-- Hardening sicurezza (alpha.2)
-- 1. Registro modifiche (audit_log) in sola aggiunta.
-- 2. Revoca esecuzione di funzioni SECURITY DEFINER al ruolo anon.

-- ---------------------------------------------------------------------------
-- 1. audit_log append-only
-- ---------------------------------------------------------------------------

drop policy if exists audit_delete_superadmin on public.audit_log;

revoke all on table public.audit_log from anon;
revoke insert, update, delete, truncate on table public.audit_log from authenticated;
grant select on table public.audit_log to authenticated;

create or replace function private.audit_log_append_only()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' or tg_op = 'TRUNCATE' then
    raise exception 'Il registro modifiche è in sola aggiunta: cancellazione non consentita'
      using errcode = 'insufficient_privilege';
  end if;

  -- Unico aggiornamento ammesso: l'azzeramento dei riferimenti esterni
  -- eseguito dalle foreign key ON DELETE SET NULL (ente, intervento, utente).
  if new.id is distinct from old.id
     or new.timestamp is distinct from old.timestamp
     or new.azione is distinct from old.azione
     or new.tabella is distinct from old.tabella
     or new.record_id is distinct from old.record_id
     or new.valore_precedente is distinct from old.valore_precedente
     or new.valore_nuovo is distinct from old.valore_nuovo
     or new.ip is distinct from old.ip
     or (new.ente_id is distinct from old.ente_id and new.ente_id is not null)
     or (new.intervento_id is distinct from old.intervento_id and new.intervento_id is not null)
     or (new.user_id is distinct from old.user_id and new.user_id is not null)
  then
    raise exception 'Il registro modifiche è in sola aggiunta: modifica non consentita'
      using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

revoke all on function private.audit_log_append_only() from public, anon, authenticated;

drop trigger if exists audit_log_no_update_delete on public.audit_log;
create trigger audit_log_no_update_delete
  before update or delete on public.audit_log
  for each row execute function private.audit_log_append_only();

drop trigger if exists audit_log_no_truncate on public.audit_log;
create trigger audit_log_no_truncate
  before truncate on public.audit_log
  for each statement execute function private.audit_log_append_only();

-- ---------------------------------------------------------------------------
-- 2. Funzioni SECURITY DEFINER non eseguibili da anon
-- ---------------------------------------------------------------------------

revoke execute on function public.school_mark_request_attachments(uuid) from public, anon;
grant execute on function public.school_mark_request_attachments(uuid) to authenticated;

-- Funzione trigger: non deve essere invocabile via /rest/v1/rpc.
revoke execute on function public.log_intervention_change() from public, anon, authenticated;

-- Le nuove funzioni create in public non saranno eseguibili da anon per default.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke execute on functions from anon;
