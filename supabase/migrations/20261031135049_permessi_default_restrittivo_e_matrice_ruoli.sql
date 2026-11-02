-- Permessi: default restrittivo e matrice iniziale per ruolo.
--
-- 1. private.user_can: senza una riga in permessi_utenti l'utente può solo
--    consultare; le azioni di scrittura/amministrazione richiedono
--    superadmin o admin_ente (prima era tutto consentito a ogni ruolo).
-- 2. File nel bucket "documenti" (interventi e manutenzioni): controllati
--    dalla matrice per risorsa invece che da private.user_can.
-- 3. Matrice iniziale in permessi_ruoli per ogni ente (non sovrascrive
--    configurazioni già presenti).

-- ---------------------------------------------------------------------------
-- 1. private.user_can deny-by-default
-- ---------------------------------------------------------------------------
create or replace function private.user_can(p_ente_id uuid, p_action text)
returns boolean
language sql
stable
security definer
set search_path to 'public', 'private'
as $function$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = (select auth.uid()) and ur.ente_id = p_ente_id
  ) and (
    exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid()) and ur.ente_id = p_ente_id
        and ur.ruolo = 'superadmin'
    )
    or (
      exists (
        select 1 from public.permessi_utenti p
        where p.ente_id = p_ente_id and p.user_id = (select auth.uid())
      )
      and exists (
        select 1 from public.permessi_utenti p
        where p.ente_id = p_ente_id and p.user_id = (select auth.uid())
          and case p_action
            when 'view' then p.can_view
            when 'create' then p.can_create
            when 'update' then p.can_update
            when 'delete' then p.can_delete
            when 'documents' then p.can_documents
            when 'admin' then p.can_admin
            else false
          end
      )
    )
    or (
      not exists (
        select 1 from public.permessi_utenti p
        where p.ente_id = p_ente_id and p.user_id = (select auth.uid())
      )
      and (
        p_action = 'view'
        or exists (
          select 1 from public.user_roles ur
          where ur.user_id = (select auth.uid()) and ur.ente_id = p_ente_id
            and ur.ruolo = 'admin_ente'
        )
      )
    )
  );
$function$;

revoke all on function private.user_can(uuid, text) from public, anon;
grant execute on function private.user_can(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Storage "documenti": matrice per risorsa
-- ---------------------------------------------------------------------------
drop policy if exists documenti_select on storage.objects;
drop policy if exists documenti_insert on storage.objects;
drop policy if exists documenti_update on storage.objects;
drop policy if exists documenti_delete on storage.objects;

create policy documenti_select on storage.objects for select to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.interventi i
  where i.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(i.ente_id, 'interventi', 'view')));

create policy documenti_insert on storage.objects for insert to authenticated
with check (bucket_id = 'documenti' and exists (
  select 1 from public.interventi i
  where i.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(i.ente_id, 'interventi', 'documents')));

create policy documenti_update on storage.objects for update to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.interventi i
  where i.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(i.ente_id, 'interventi', 'documents')))
with check (bucket_id = 'documenti' and exists (
  select 1 from public.interventi i
  where i.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(i.ente_id, 'interventi', 'documents')));

create policy documenti_delete on storage.objects for delete to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.interventi i
  where i.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(i.ente_id, 'interventi', 'documents')));

drop policy if exists manutenzione_storage_select on storage.objects;
drop policy if exists manutenzione_storage_insert on storage.objects;
drop policy if exists manutenzione_storage_update on storage.objects;
drop policy if exists manutenzione_storage_delete on storage.objects;

create policy manutenzione_storage_select on storage.objects for select to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.edifici e
  where e.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(e.ente_id, 'manutenzioni', 'view')));

create policy manutenzione_storage_insert on storage.objects for insert to authenticated
with check (bucket_id = 'documenti' and exists (
  select 1 from public.edifici e
  where e.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(e.ente_id, 'manutenzioni', 'documents')));

create policy manutenzione_storage_update on storage.objects for update to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.edifici e
  where e.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(e.ente_id, 'manutenzioni', 'documents')))
with check (bucket_id = 'documenti' and exists (
  select 1 from public.edifici e
  where e.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(e.ente_id, 'manutenzioni', 'documents')));

create policy manutenzione_storage_delete on storage.objects for delete to authenticated
using (bucket_id = 'documenti' and exists (
  select 1 from public.edifici e
  where e.id::text = (storage.foldername(objects.name))[1]
    and private.user_can_resource(e.ente_id, 'manutenzioni', 'documents')));

-- ---------------------------------------------------------------------------
-- 3. Matrice iniziale per ruolo (V C M E D A = view create update delete documents admin)
-- ---------------------------------------------------------------------------
with matrice(ruolo, risorsa, perm) as (values
  -- risorse dati
  ('admin_ente','edifici','VCMEDA'),('admin_ente','impianti','VCMEDA'),('admin_ente','fascicoli','VCMEDA'),
  ('admin_ente','interventi','VCMEDA'),('admin_ente','richieste','VCMEDA'),('admin_ente','manutenzioni','VCMEDA'),
  ('rup','edifici','V'),('rup','impianti','V'),('rup','fascicoli','VD'),
  ('rup','interventi','VCMD'),('rup','richieste','VCM'),('rup','manutenzioni','V'),
  ('tecnico','edifici','VM'),('tecnico','impianti','VCM'),('tecnico','fascicoli','VCD'),
  ('tecnico','interventi','VCMD'),('tecnico','richieste','VCM'),('tecnico','manutenzioni','VCMD'),
  ('amministrativo','edifici','V'),('amministrativo','impianti','V'),('amministrativo','fascicoli','V'),
  ('amministrativo','interventi','VMD'),('amministrativo','richieste','V'),('amministrativo','manutenzioni','V'),
  ('direttore_lavori','edifici','V'),('direttore_lavori','impianti','V'),('direttore_lavori','fascicoli','V'),
  ('direttore_lavori','interventi','VMD'),('direttore_lavori','richieste','V'),('direttore_lavori','manutenzioni','V'),
  ('auditor','edifici','V'),('auditor','impianti','V'),('auditor','fascicoli','V'),
  ('auditor','interventi','V'),('auditor','richieste','V'),('auditor','manutenzioni','V'),
  ('consultatore','edifici','V'),('consultatore','impianti','V'),
  ('consultatore','interventi','V'),('consultatore','richieste','V'),('consultatore','manutenzioni','V'),
  ('manutentore','edifici','V'),('manutentore','impianti','VM'),
  ('manutentore','richieste','VM'),('manutentore','manutenzioni','VCMD'),
  ('siservizi','edifici','V'),('siservizi','impianti','V'),('siservizi','fascicoli','V'),
  ('siservizi','interventi','V'),('siservizi','richieste','VM'),('siservizi','manutenzioni','VCMD'),
  -- voci di menu
  ('admin_ente','dashboard','V'),('admin_ente','report','V'),('admin_ente','amministrazione','V'),('admin_ente','import_impianti','V'),
  ('rup','dashboard','V'),('rup','report','V'),
  ('tecnico','dashboard','V'),('tecnico','report','V'),
  ('amministrativo','dashboard','V'),('amministrativo','report','V'),
  ('direttore_lavori','dashboard','V'),('direttore_lavori','report','V'),
  ('auditor','dashboard','V'),('auditor','report','V'),
  ('consultatore','dashboard','V'),('consultatore','report','V'),
  ('manutentore','dashboard','V'),
  ('siservizi','dashboard','V')
)
insert into public.permessi_ruoli
  (ente_id, ruolo, risorsa, can_view, can_create, can_update, can_delete, can_documents, can_admin)
select e.id, m.ruolo::public.app_role, m.risorsa,
       position('V' in m.perm) > 0, position('C' in m.perm) > 0, position('M' in m.perm) > 0,
       position('E' in m.perm) > 0, position('D' in m.perm) > 0, position('A' in m.perm) > 0
from public.enti e cross join matrice m
on conflict (ente_id, ruolo, risorsa) do nothing;
