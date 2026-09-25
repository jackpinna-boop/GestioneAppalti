-- Gestione Appalti: livelli di progettazione e cronologia per intervento
-- Idempotente: aggiunge i nuovi valori all'enum esistente senza modificare PFTE/ESE già presenti.

ALTER TYPE public.progetto_livello ADD VALUE IF NOT EXISTS 'in_programmazione' BEFORE 'pfte';
ALTER TYPE public.progetto_livello ADD VALUE IF NOT EXISTS 'programmato' BEFORE 'pfte';
ALTER TYPE public.progetto_livello ADD VALUE IF NOT EXISTS 'dip' BEFORE 'pfte';

ALTER TABLE public.audit_log
  ADD COLUMN IF NOT EXISTS intervento_id uuid NULL
  REFERENCES public.interventi(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS audit_log_intervento_timestamp_idx
  ON public.audit_log (intervento_id, timestamp DESC);

CREATE OR REPLACE FUNCTION public.log_intervention_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new jsonb := CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END;
  v_old jsonb := CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END;
  v_row jsonb := COALESCE(v_new, v_old);
  v_intervento_id uuid := NULL;
  v_ente_id uuid := NULL;
  v_record_id text := COALESCE(v_row->>'id', '');
  v_contract_id uuid;
  v_sal_id uuid;
  v_atto_id uuid;
  r record;
BEGIN
  IF TG_OP = 'UPDATE' AND v_new = v_old THEN
    RETURN NEW;
  END IF;

  -- Tabelle direttamente collegate all'intervento.
  IF v_row ? 'intervento_id' THEN
    v_intervento_id := NULLIF(v_row->>'intervento_id','')::uuid;
  END IF;

  -- Tabelle collegate tramite contratto.
  IF v_intervento_id IS NULL AND v_row ? 'contratto_id' THEN
    v_contract_id := NULLIF(v_row->>'contratto_id','')::uuid;
    IF v_contract_id IS NOT NULL THEN
      SELECT c.intervento_id INTO v_intervento_id
      FROM public.contratti c
      WHERE c.id = v_contract_id;
    END IF;
  END IF;

  -- Pagamenti: contratto oppure SAL.
  IF TG_TABLE_NAME = 'pagamenti' AND v_intervento_id IS NULL THEN
    v_sal_id := NULLIF(v_row->>'sal_id','')::uuid;
    IF v_sal_id IS NOT NULL THEN
      SELECT c.intervento_id INTO v_intervento_id
      FROM public.sal s
      JOIN public.contratti c ON c.id = s.contratto_id
      WHERE s.id = v_sal_id;
    END IF;
  END IF;

  -- Voci del quadro economico.
  IF TG_TABLE_NAME = 'voci_quadro_economico' AND v_intervento_id IS NULL THEN
    SELECT q.intervento_id INTO v_intervento_id
    FROM public.quadri_economici q
    WHERE q.id = NULLIF(v_row->>'quadro_economico_id','')::uuid;
  END IF;

  -- Gli atti possono essere associati a uno o più interventi tramite atti_intervento.
  IF TG_TABLE_NAME = 'atti' THEN
    v_atto_id := NULLIF(v_row->>'id','')::uuid;
    FOR r IN
      SELECT ai.intervento_id
      FROM public.atti_intervento ai
      WHERE ai.atto_id = v_atto_id
    LOOP
      SELECT i.ente_id INTO v_ente_id FROM public.interventi i WHERE i.id = r.intervento_id;
      INSERT INTO public.audit_log
        (ente_id, intervento_id, user_id, azione, tabella, record_id, valore_precedente, valore_nuovo)
      VALUES
        (v_ente_id, r.intervento_id, auth.uid(), TG_OP, TG_TABLE_NAME, NULLIF(v_record_id,'')::uuid, v_old, v_new);
    END LOOP;
    RETURN COALESCE(NEW, OLD);
  END IF;

  IF v_intervento_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT i.ente_id INTO v_ente_id
  FROM public.interventi i
  WHERE i.id = v_intervento_id;

  -- La tabella ponte atti_intervento non ha una colonna id.
  IF TG_TABLE_NAME = 'atti_intervento' THEN
    v_record_id := COALESCE(v_row->>'atto_id', v_row->>'intervento_id');
  END IF;

  INSERT INTO public.audit_log
    (ente_id, intervento_id, user_id, azione, tabella, record_id, valore_precedente, valore_nuovo)
  VALUES
    (v_ente_id, v_intervento_id, auth.uid(), TG_OP, TG_TABLE_NAME, NULLIF(v_record_id,''), v_old, v_new);

  RETURN COALESCE(NEW, OLD);
END;
$$;

REVOKE ALL ON FUNCTION public.log_intervention_change() FROM PUBLIC;

DO $$
DECLARE
  t text;
  direct_tables text[] := ARRAY[
    'interventi',
    'fasi_intervento',
    'progetti',
    'quadri_economici',
    'procedure_affidamento',
    'contratti',
    'colluadi',
    'documenti',
    'finanziamenti_intervento',
    'incarichi_intervento',
    'programmazione_interventi',
    'atti_intervento',
    'voci_quadro_economico',
    'sal',
    'pagamenti',
    'varianti',
    'atti'
  ];
BEGIN
  FOREACH t IN ARRAY direct_tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_intervento ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_audit_intervento AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_intervention_change()',
      t
    );
  END LOOP;
END $$;
