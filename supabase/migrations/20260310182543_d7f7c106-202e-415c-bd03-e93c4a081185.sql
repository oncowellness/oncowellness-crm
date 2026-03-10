
-- Clinical Encounters table (SOAP-structured visits)
CREATE TABLE public.encounters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  staff_id UUID,
  staff_name TEXT,
  encounter_type TEXT NOT NULL DEFAULT 'successive' CHECK (encounter_type IN ('initial', 'successive', 'phase_transition', 'emergency')),
  phase_at_encounter TEXT NOT NULL DEFAULT 'F1',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  
  -- SOAP Structure
  subjective JSONB DEFAULT '{}'::jsonb,
  objective JSONB DEFAULT '{}'::jsonb,
  assessment JSONB DEFAULT '{}'::jsonb,
  plan JSONB DEFAULT '{}'::jsonb,
  
  -- Phase transition
  triggers_phase_transition BOOLEAN DEFAULT false,
  new_phase TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.encounters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all encounters"
  ON public.encounters FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director')));

CREATE POLICY "Staff reads assigned patient encounters"
  ON public.encounters FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

CREATE POLICY "Staff or admins insert encounters"
  ON public.encounters FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director') OR is_assigned_to_patient(auth.uid(), patient_id)));

CREATE POLICY "Staff or admins update encounters"
  ON public.encounters FOR UPDATE TO authenticated
  USING (is_active_user(auth.uid()) AND (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director') OR is_assigned_to_patient(auth.uid(), patient_id)));

-- Updated_at trigger
CREATE TRIGGER update_encounters_updated_at
  BEFORE UPDATE ON public.encounters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.encounters;
