-- Consente la rimozione dei record del fascicolo agli utenti autorizzati alla modifica dell'intervento,
-- senza concedere automaticamente la rimozione dell'intervento principale.

drop policy if exists fasi_delete on public.fasi_intervento;
create policy fasi_delete on public.fasi_intervento for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=fasi_intervento.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists progetti_delete on public.progetti;
create policy progetti_delete on public.progetti for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=progetti.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists qe_delete on public.quadri_economici;
create policy qe_delete on public.quadri_economici for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=quadri_economici.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists procedure_delete on public.procedure_affidamento;
create policy procedure_delete on public.procedure_affidamento for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=procedure_affidamento.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists contratti_delete on public.contratti;
create policy contratti_delete on public.contratti for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=contratti.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists sal_delete on public.sal;
create policy sal_delete on public.sal for delete to authenticated
using (exists (select 1 from public.contratti c join public.interventi i on i.id=c.intervento_id where c.id=sal.contratto_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists pagamenti_delete on public.pagamenti;
create policy pagamenti_delete on public.pagamenti for delete to authenticated
using (exists (select 1 from public.contratti c join public.interventi i on i.id=c.intervento_id where c.id=pagamenti.contratto_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists varianti_delete on public.varianti;
create policy varianti_delete on public.varianti for delete to authenticated
using (exists (select 1 from public.contratti c join public.interventi i on i.id=c.intervento_id where c.id=varianti.contratto_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists atti_delete on public.atti;
create policy atti_delete on public.atti for delete to authenticated
using (private.user_can_resource(ente_id,'interventi','update'));

drop policy if exists atti_intervento_delete on public.atti_intervento;
create policy atti_intervento_delete on public.atti_intervento for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=atti_intervento.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));

drop policy if exists collaudi_delete on public.colluadi;
create policy collaudi_delete on public.colluadi for delete to authenticated
using (exists (select 1 from public.interventi i where i.id=colluadi.intervento_id and private.user_can_resource(i.ente_id,'interventi','update')));
