
-- ============================================================
-- SPRINT 1, STEP 2: Create alerts table with RLS
-- ============================================================

-- Check if types already exist from partial previous run
DO $$ BEGIN
  CREATE TYPE public.alert_type AS ENUM ('emotional_risk', 'fall_risk', 'clinical_decline', 'custom');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.alert_severity AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Create alerts table if not exists
CREATE TABLE IF NOT EXISTS public.alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  alert_type public.alert_type NOT NULL,
  severity public.alert_severity NOT NULL DEFAULT 'medium',
  source_metric text,
  source_value numeric,
  source_test_id uuid REFERENCES public.clinical_tests(id),
  message text,
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- RLS policies (without AS RESTRICTIVE — uses default PERMISSIVE, combined with table-level RLS)
CREATE POLICY "Directors see all alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Staff sees assigned patient alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (
    public.is_assigned_to_patient(auth.uid(), patient_id)
  );

CREATE POLICY "System insert alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Staff can resolve alerts"
  ON public.alerts FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alerts_patient_id ON public.alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON public.alerts(resolved) WHERE resolved = false;

-- ============================================================
-- Update PHQ-9 trigger to also insert into alerts
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_phq9_alert()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo = 'PHQ-9' AND NEW.valor_numerico >= 10 THEN
    UPDATE public.patients
    SET alert_status = 'rojo', mind_state = 'Depresivo'
    WHERE id = NEW.patient_id;

    INSERT INTO public.crisis_orders (patient_id, trigger_reason, program, status)
    VALUES (
      NEW.patient_id,
      'PHQ-9 >= 10 (Puntuación: ' || NEW.valor_numerico || ')',
      'PS-01',
      'pendiente'
    );

    INSERT INTO public.alerts (patient_id, alert_type, severity, source_metric, source_value, source_test_id, message)
    VALUES (
      NEW.patient_id,
      'emotional_risk',
      CASE WHEN NEW.valor_numerico >= 20 THEN 'critical'
           WHEN NEW.valor_numerico >= 15 THEN 'high'
           ELSE 'medium' END,
      'PHQ-9',
      NEW.valor_numerico,
      NEW.id,
      'PHQ-9 = ' || NEW.valor_numerico || ' — Riesgo emocional detectado'
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- ============================================================
-- Update TUG trigger to also insert into alerts
-- ============================================================
CREATE OR REPLACE FUNCTION public.check_tug_fall_risk()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.tipo = 'TUG' AND NEW.valor_numerico > 12 THEN
    UPDATE public.patients
    SET high_fall_risk = true
    WHERE id = NEW.patient_id;

    INSERT INTO public.alerts (patient_id, alert_type, severity, source_metric, source_value, source_test_id, message)
    VALUES (
      NEW.patient_id,
      'fall_risk',
      CASE WHEN NEW.valor_numerico > 20 THEN 'critical'
           WHEN NEW.valor_numerico > 15 THEN 'high'
           ELSE 'medium' END,
      'TUG',
      NEW.valor_numerico,
      NEW.id,
      'TUG = ' || NEW.valor_numerico || 's — Riesgo de caída elevado'
    );
  END IF;
  RETURN NEW;
END;
$function$;
