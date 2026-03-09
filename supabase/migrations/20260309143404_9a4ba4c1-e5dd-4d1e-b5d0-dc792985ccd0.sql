
-- ============================================================
-- CLINICAL EVENTS — Sprint S12
-- Boundary: Clinical Core
-- Tracks phase transitions and clinical milestones
-- ============================================================

CREATE TABLE public.clinical_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'phase_transition',
  previous_phase phase_journey,
  new_phase phase_journey,
  reason TEXT,
  performed_by UUID,
  performed_by_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clinical_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all clinical events" ON public.clinical_events
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

CREATE POLICY "Staff reads assigned patient events" ON public.clinical_events
  FOR SELECT TO authenticated
  USING (is_assigned_to_patient(auth.uid(), patient_id));

CREATE POLICY "Staff or admins insert clinical events" ON public.clinical_events
  FOR INSERT TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director')
    OR is_assigned_to_patient(auth.uid(), patient_id)
  );

-- Index for fast patient lookups
CREATE INDEX idx_clinical_events_patient ON public.clinical_events(patient_id, created_at DESC);
