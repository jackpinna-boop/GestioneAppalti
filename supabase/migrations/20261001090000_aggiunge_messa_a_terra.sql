-- Aggiunge la tipologia base "Impianti di messa a terra" e rende il vincolo tipo coerente.

DO $$
DECLARE
  v_name text;
BEGIN
  SELECT c.conname INTO v_name
  FROM pg_constraint c
  WHERE c.conrelid='public.impianti_manutentivi'::regclass
    AND c.contype='c'
    AND pg_get_constraintdef(c.oid) ILIKE '%tipo%';
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.impianti_manutentivi DROP CONSTRAINT %I', v_name);
  END IF;
END $$;

ALTER TABLE public.impianti_manutentivi
  ADD CONSTRAINT impianti_manutentivi_tipo_check
  CHECK (tipo IN (
    'elettrico','termico','fotovoltaico','accumulo',
    'condizionamento_climatizzazione','antincendio_naspi_idranti',
    'antincendio_gruppi_pressurizzazione',
    'antincendio_segnalazione_rilevazione',
    'antintrusione','videosorveglianza','controllo_accessi','generico',
    'messa_a_terra',
    'idraulico','antincendio','elevatore','antifurto','illuminazione_emergenza',
    'rilevazione_incendi','climatizzazione','pompa_di_calore'
  ));

INSERT INTO public.tipologie_impianto
  (ente_id,codice,denominazione,categoria,descrizione,attivo,ordinamento,gestione_manutenzione,gestione_scadenze,gestione_documenti,gestione_alert)
VALUES
  ('00000000-0000-4000-8000-000000000001',
   'MESSA_A_TERRA',
   'Impianti di messa a terra',
   'Elettrico',
   'Impianti di messa a terra e relativi sistemi di dispersione e protezione.',
   true,55,true,true,true,true)
ON CONFLICT (ente_id,codice) DO UPDATE SET
  denominazione=excluded.denominazione,
  categoria=excluded.categoria,
  descrizione=excluded.descrizione,
  attivo=true,
  ordinamento=excluded.ordinamento,
  gestione_manutenzione=true,
  gestione_scadenze=true,
  gestione_documenti=true,
  gestione_alert=true,
  updated_at=now();


-- Esempi demo: un impianto di messa a terra per ciascun edificio demo.
INSERT INTO public.impianti_manutentivi
(id,ente_id,edificio_id,tipo,codice,denominazione,ubicazione,marca_modello,matricola,anno_installazione,stato,data_ultima_manutenzione,data_prossima_manutenzione,periodicita_mesi,ditta_manutentrice,referente,numero_rapporto,conformita,note,data_installazione,data_verifica,data_collaudo,data_ultimo_controllo_periodico,data_prossimo_controllo_periodico)
VALUES
('00000000-0000-4000-8000-000000001437','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000101','messa_a_terra','IMP-DEMO-037','Impianto di messa a terra - Edificio 1','Locale tecnico / area dispersori','Sistema di terra Demo','MT-DEMO-001',2022,'attivo','2026-06-15','2026-12-15',12,'MANUTENZIONI DEMO S.R.L.','Referente Demo','RAP-DEMO-037',true,'DATO DEMO','2022-06-15','2025-10-01','2025-11-01','2025-10-01','2026-10-04'),
('00000000-0000-4000-8000-000000001438','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000102','messa_a_terra','IMP-DEMO-038','Impianto di messa a terra - Edificio 2','Locale tecnico / area dispersori','Sistema di terra Demo','MT-DEMO-002',2022,'attivo','2026-06-15','2026-12-15',12,'MANUTENZIONI DEMO S.R.L.','Referente Demo','RAP-DEMO-038',true,'DATO DEMO','2022-06-15','2025-10-01','2025-11-01','2025-10-01','2026-10-07'),
('00000000-0000-4000-8000-000000001439','00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000103','messa_a_terra','IMP-DEMO-039','Impianto di messa a terra - Edificio 3','Locale tecnico / area dispersori','Sistema di terra Demo','MT-DEMO-003',2022,'attivo','2026-06-15','2026-12-15',12,'MANUTENZIONI DEMO S.R.L.','Referente Demo','RAP-DEMO-039',true,'DATO DEMO','2022-06-15','2025-10-01','2025-11-01','2025-10-01','2026-10-27')
ON CONFLICT (id) DO NOTHING;
