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
