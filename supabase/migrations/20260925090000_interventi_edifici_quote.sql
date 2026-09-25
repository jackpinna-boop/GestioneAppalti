CREATE TABLE IF NOT EXISTS public.interventi_edifici_quote (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ente_id uuid NOT NULL REFERENCES public.enti(id) ON DELETE CASCADE,
  intervento_id uuid NOT NULL REFERENCES public.interventi(id) ON DELETE CASCADE,
  edificio_id uuid NOT NULL REFERENCES public.edifici(id) ON DELETE CASCADE,
  percentuale numeric(7,4),
  importo_attribuito numeric(15,2),
  criterio_attribuzione text NOT NULL DEFAULT 'NON_RIPARTITO'
    CHECK (criterio_attribuzione IN ('UNICA','PERCENTUALE','IMPORTO','NON_RIPARTITO')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT interventi_edifici_quote_chk CHECK (
    (criterio_attribuzione='NON_RIPARTITO' AND percentuale IS NULL AND importo_attribuito IS NULL)
    OR (criterio_attribuzione='PERCENTUALE' AND percentuale >= 0 AND percentuale <= 100)
    OR (criterio_attribuzione='IMPORTO' AND importo_attribuito >= 0)
    OR (criterio_attribuzione='UNICA' AND percentuale = 100)
  )
);
CREATE UNIQUE INDEX IF NOT EXISTS interventi_edifici_quote_uq ON public.interventi_edifici_quote(intervento_id,edificio_id);
CREATE INDEX IF NOT EXISTS interventi_edifici_quote_intervento_idx ON public.interventi_edifici_quote(intervento_id);
ALTER TABLE public.interventi_edifici_quote ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS interventi_edifici_quote_select ON public.interventi_edifici_quote;
DROP POLICY IF EXISTS interventi_edifici_quote_insert ON public.interventi_edifici_quote;
DROP POLICY IF EXISTS interventi_edifici_quote_update ON public.interventi_edifici_quote;
DROP POLICY IF EXISTS interventi_edifici_quote_delete ON public.interventi_edifici_quote;
CREATE POLICY interventi_edifici_quote_select ON public.interventi_edifici_quote FOR SELECT USING (private.user_can_resource(ente_id,'interventi','view'));
CREATE POLICY interventi_edifici_quote_insert ON public.interventi_edifici_quote FOR INSERT WITH CHECK (private.user_can_resource(ente_id,'interventi','create'));
CREATE POLICY interventi_edifici_quote_update ON public.interventi_edifici_quote FOR UPDATE USING (private.user_can_resource(ente_id,'interventi','update')) WITH CHECK (private.user_can_resource(ente_id,'interventi','update'));
CREATE POLICY interventi_edifici_quote_delete ON public.interventi_edifici_quote FOR DELETE USING (private.user_can_resource(ente_id,'interventi','delete'));
CREATE OR REPLACE FUNCTION public.set_interventi_edifici_quote_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN NEW.updated_at=now(); RETURN NEW; END $$;
DROP TRIGGER IF EXISTS trg_interventi_edifici_quote_updated_at ON public.interventi_edifici_quote;
CREATE TRIGGER trg_interventi_edifici_quote_updated_at BEFORE UPDATE ON public.interventi_edifici_quote FOR EACH ROW EXECUTE FUNCTION public.set_interventi_edifici_quote_updated_at();
DROP TRIGGER IF EXISTS trg_audit_intervento ON public.interventi_edifici_quote;
CREATE TRIGGER trg_audit_intervento AFTER INSERT OR UPDATE OR DELETE ON public.interventi_edifici_quote FOR EACH ROW EXECUTE FUNCTION public.log_intervention_change();