-- ============================================================
-- CLINICAL LIFECYCLE & SCHEDULING
-- ============================================================

-- 1. Enums for Scheduling and Triage
CREATE TYPE public.appointment_type AS ENUM ('initial', 'follow_up', 'acute', 'triage');
CREATE TYPE public.triage_level AS ENUM ('red', 'amber', 'green');
CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');

-- 2. Create Appointments Table (Scheduling Domain)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES auth.users(id), -- Optional, can be unassigned initially
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    appointment_type public.appointment_type NOT NULL,
    status public.appointment_status DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraint: End time must be after start time
    CONSTRAINT check_dates CHECK (end_time > start_time)
);

-- 3. Enhance Patients Table (Clinical Pathways & Triage)
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS triage_level public.triage_level,
ADD COLUMN IF NOT EXISTS clinical_pathway TEXT, -- e.g., "Active Worker", "Palliative"
ADD COLUMN IF NOT EXISTS anamnesis_data JSONB DEFAULT '{}'::jsonb, -- Structured SNOMED/ICD-10
ADD COLUMN IF NOT EXISTS gdpr_consent_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS hipaa_consent_date TIMESTAMPTZ;

-- 4. RLS for Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff and Admins can view appointments"
    ON public.appointments FOR SELECT
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'director')
        OR public.is_assigned_to_patient(auth.uid(), patient_id)
        OR staff_id = auth.uid()
    );

CREATE POLICY "Staff and Admins can manage appointments"
    ON public.appointments FOR ALL
    TO authenticated
    USING (
        public.has_role(auth.uid(), 'admin') 
        OR public.has_role(auth.uid(), 'director')
        OR public.is_assigned_to_patient(auth.uid(), patient_id)
    );

-- 5. Strict RLS for Clinical Notes (Privacy Guardrail)
-- Requirement: Clinicians (Full Access), Admins (No Access to note_content)
-- Implementation: We restrict SELECT access entirely for Admins. 
-- They can see metadata via other tables if needed, but the notes table is black-boxed.

DROP POLICY IF EXISTS "Authenticated can select clinical notes" ON public.clinical_notes;
DROP POLICY IF EXISTS "Assigned staff or admins insert clinical notes" ON public.clinical_notes;

-- Re-create INSERT policy (Admins can INSERT system notes if needed, but usually clinicians)
CREATE POLICY "Clinicians and Directors insert notes"
    ON public.clinical_notes FOR INSERT
    TO authenticated
    WITH CHECK (
        public.has_role(auth.uid(), 'director')
        OR public.is_assigned_to_patient(auth.uid(), patient_id)
    );

-- SELECT Policy: Explicitly EXCLUDE admin role from reading notes
CREATE POLICY "Clinicians view notes (Admins excluded)"
    ON public.clinical_notes FOR SELECT
    TO authenticated
    USING (
        -- User must NOT be an admin (unless they also hold a clinical role, handled by OR logic if roles were array)
        -- Assuming strict single-role or priority:
        (NOT public.has_role(auth.uid(), 'admin'))
        AND 
        (
            public.has_role(auth.uid(), 'director') -- Directors (Clinical Leads) usually need access
            OR public.is_assigned_to_patient(auth.uid(), patient_id)
        )
    );

-- 6. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_start_time ON public.appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_patients_triage ON public.patients(triage_level);

-- 7. Trigger for Updated At
CREATE TRIGGER update_appointments_modtime
    BEFORE UPDATE ON public.appointments
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();