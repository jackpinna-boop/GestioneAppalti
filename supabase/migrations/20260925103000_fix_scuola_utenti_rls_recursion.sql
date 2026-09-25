-- Fix RLS recursion on public.scuola_utenti.
-- The previous policies evaluated scuola_utenti from inside their own
-- predicates, causing PostgreSQL to raise:
-- "infinite recursion detected in policy for relation scuola_utenti".

create or replace function private.school_admin_can_manage_school(
  p_school_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.scuole s
    join public.user_roles ur
      on ur.ente_id = s.ente_id
     and ur.user_id = p_user_id
    where s.id = p_school_id
      and ur.ruolo in ('superadmin','admin_ente')
  );
$$;

create or replace function private.school_user_can_view(
  p_school_user_id uuid,
  p_user_id uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public, private
as $$
  select exists (
    select 1
    from public.scuola_utenti su
    join public.scuole s on s.id = su.scuola_id
    where su.id = p_school_user_id
      and (
        su.user_id = p_user_id
        or exists (
          select 1
          from public.user_roles ur
          where ur.user_id = p_user_id
            and ur.ente_id = s.ente_id
            and ur.ruolo in ('superadmin','admin_ente')
        )
      )
  );
$$;

revoke all on function private.school_admin_can_manage_school(uuid,uuid) from public, anon;
revoke all on function private.school_user_can_view(uuid,uuid) from public, anon;
grant execute on function private.school_admin_can_manage_school(uuid,uuid) to authenticated;
grant execute on function private.school_user_can_view(uuid,uuid) to authenticated;

do $$
declare
  p record;
begin
  for p in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'scuola_utenti'
  loop
    execute format(
      'drop policy if exists %I on public.scuola_utenti',
      p.policyname
    );
  end loop;
end $$;

create policy scuola_utenti_select
on public.scuola_utenti
for select
to authenticated
using (
  private.school_user_can_view(id, auth.uid())
);

create policy scuola_utenti_insert
on public.scuola_utenti
for insert
to authenticated
with check (
  private.school_admin_can_manage_school(scuola_id, auth.uid())
);

create policy scuola_utenti_update
on public.scuola_utenti
for update
to authenticated
using (
  private.school_admin_can_manage_school(scuola_id, auth.uid())
)
with check (
  private.school_admin_can_manage_school(scuola_id, auth.uid())
);

create policy scuola_utenti_delete
on public.scuola_utenti
for delete
to authenticated
using (
  private.school_admin_can_manage_school(scuola_id, auth.uid())
);
