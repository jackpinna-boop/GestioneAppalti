-- Associa ai singoli interventi lo storico audit già esistente, quando il record è ancora presente.
UPDATE public.audit_log a SET intervento_id=i.id
FROM public.interventi i
WHERE a.intervento_id IS NULL AND a.tabella='interventi' AND a.record_id=i.id;

UPDATE public.audit_log a SET intervento_id=f.intervento_id
FROM public.fasi_intervento f
WHERE a.intervento_id IS NULL AND a.tabella='fasi_intervento' AND a.record_id=f.id;

UPDATE public.audit_log a SET intervento_id=p.intervento_id
FROM public.progetti p
WHERE a.intervento_id IS NULL AND a.tabella='progetti' AND a.record_id=p.id;

UPDATE public.audit_log a SET intervento_id=q.intervento_id
FROM public.quadri_economici q
WHERE a.intervento_id IS NULL AND a.tabella='quadri_economici' AND a.record_id=q.id;

UPDATE public.audit_log a SET intervento_id=p.intervento_id
FROM public.procedure_affidamento p
WHERE a.intervento_id IS NULL AND a.tabella='procedure_affidamento' AND a.record_id=p.id;

UPDATE public.audit_log a SET intervento_id=c.intervento_id
FROM public.contratti c
WHERE a.intervento_id IS NULL AND a.tabella='contratti' AND a.record_id=c.id;

UPDATE public.audit_log a SET intervento_id=c.intervento_id
FROM public.sal s JOIN public.contratti c ON c.id=s.contratto_id
WHERE a.intervento_id IS NULL AND a.tabella='sal' AND a.record_id=s.id;

UPDATE public.audit_log a SET intervento_id=c.intervento_id
FROM public.varianti v JOIN public.contratti c ON c.id=v.contratto_id
WHERE a.intervento_id IS NULL AND a.tabella='varianti' AND a.record_id=v.id;

UPDATE public.audit_log a SET intervento_id=c.intervento_id
FROM public.pagamenti p JOIN public.contratti c ON c.id=p.contratto_id
WHERE a.intervento_id IS NULL AND a.tabella='pagamenti' AND a.record_id=p.id;

UPDATE public.audit_log a SET intervento_id=d.intervento_id
FROM public.documenti d
WHERE a.intervento_id IS NULL AND a.tabella='documenti' AND a.record_id=d.id;

UPDATE public.audit_log a SET intervento_id=f.intervento_id
FROM public.finanziamenti_intervento f
WHERE a.intervento_id IS NULL AND a.tabella='finanziamenti_intervento' AND a.record_id=f.id;

UPDATE public.audit_log a SET intervento_id=i.intervento_id
FROM public.incarichi_intervento i
WHERE a.intervento_id IS NULL AND a.tabella='incarichi_intervento' AND a.record_id=i.id;

UPDATE public.audit_log a SET intervento_id=p.intervento_id
FROM public.programmazione_interventi p
WHERE a.intervento_id IS NULL AND a.tabella='programmazione_interventi' AND a.record_id=p.id;

UPDATE public.audit_log a SET intervento_id=q.intervento_id
FROM public.voci_quadro_economico v
JOIN public.quadri_economici q ON q.id=v.quadro_economico_id
WHERE a.intervento_id IS NULL AND a.tabella='voci_quadro_economico' AND a.record_id=v.id;