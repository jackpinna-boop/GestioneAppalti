-- PROPOSTA (NON APPLICATA) — Agente E, 2026-11-02
-- Revoca delle sessioni di un utente dopo l'azzeramento della verifica in due
-- passaggi (azione mfa_reset dell'Edge Function admin-users).
--
-- L'API amministrativa di Supabase Auth non offre la chiusura delle sessioni per
-- id utente (auth.admin.signOut richiede il JWT dell'utente). L'Edge Function
-- invoca già admin.rpc('admin_revoke_user_sessions', { p_user_id }) e, finché
-- questa funzione non esiste, registra sessioni_revocate=false nell'audit.
--
-- Effetto: elimina le righe di auth.sessions dell'utente (i refresh token sono
-- eliminati a cascata). I token di accesso già emessi restano validi fino alla
-- scadenza (durata JWT del progetto, predefinita 1 ora).
-- Eseguibile solo con il ruolo service_role (client amministrativo).

create or replace function public.admin_revoke_user_sessions(p_user_id uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  n integer;
begin
  delete from auth.sessions where user_id = p_user_id;
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.admin_revoke_user_sessions(uuid) from public, anon, authenticated;
grant execute on function public.admin_revoke_user_sessions(uuid) to service_role;
