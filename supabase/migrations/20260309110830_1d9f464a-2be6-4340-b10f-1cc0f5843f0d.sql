
-- 1. Create patient_assignments table
CREATE TABLE public.patient_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (staff_id, patient_id)
);

-- 2. Enable RLS
ALTER TABLE public.patient_assignments ENABLE ROW LEVEL SECURITY;

-- 3. RLS policies for patient_assignments
CREATE POLICY "Admins can manage assignments"
  ON public.patient_assignments FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'director'));

CREATE POLICY "Staff can read own assignments"
  ON public.patient_assignments FOR SELECT
  TO authenticated
  USING (auth.uid() = staff_id);

-- 4. Add suspended column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN NOT NULL DEFAULT false;

-- 5. Security definer function to check patient assignment
CREATE OR REPLACE FUNCTION public.is_assigned_to_patient(_user_id uuid, _patient_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.patient_assignments
    WHERE staff_id = _user_id AND patient_id = _patient_id
  )
$$;

-- 6. Update patients SELECT policies - drop old staff policy and recreate
DROP POLICY IF EXISTS "Staff sees assigned patients" ON public.patients;
CREATE POLICY "Staff sees assigned patients"
  ON public.patients FOR SELECT
  TO authenticated
  USING (public.is_assigned_to_patient(auth.uid(), id));

-- 7. Update patients UPDATE policy
DROP POLICY IF EXISTS "Staff can update assigned patients" ON public.patients;
CREATE POLICY "Staff can update assigned patients"
  ON public.patients FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'director') 
    OR public.has_role(auth.uid(), 'admin') 
    OR public.is_assigned_to_patient(auth.uid(), id)
  );
