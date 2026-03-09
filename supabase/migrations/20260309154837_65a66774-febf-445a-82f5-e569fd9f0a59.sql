
-- Clinical goals table for personalized patient goals
CREATE TABLE public.clinical_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  metric_type TEXT, -- e.g. 'Handgrip', '6MWT', 'PHQ-9', 'custom'
  target_value NUMERIC,
  target_unit TEXT, -- e.g. 'kg', 'm', 'puntos'
  current_value NUMERIC,
  baseline_value NUMERIC,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'activa', -- activa, cumplida, vencida, cancelada
  priority TEXT NOT NULL DEFAULT 'media', -- alta, media, baja
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.clinical_goals ENABLE ROW LEVEL SECURITY;

-- Admins/directors full access
CREATE POLICY "Admins manage clinical goals"
ON public.clinical_goals FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'))
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'director'));

-- Assigned staff can read goals for their patients
CREATE POLICY "Staff reads assigned patient goals"
ON public.clinical_goals FOR SELECT TO authenticated
USING (is_assigned_to_patient(auth.uid(), patient_id));

-- Assigned staff can insert/update goals for their patients
CREATE POLICY "Staff manages assigned patient goals"
ON public.clinical_goals FOR INSERT TO authenticated
WITH CHECK (is_assigned_to_patient(auth.uid(), patient_id));

CREATE POLICY "Staff updates assigned patient goals"
ON public.clinical_goals FOR UPDATE TO authenticated
USING (is_assigned_to_patient(auth.uid(), patient_id));

-- Updated_at trigger
CREATE TRIGGER update_clinical_goals_updated_at
  BEFORE UPDATE ON public.clinical_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
