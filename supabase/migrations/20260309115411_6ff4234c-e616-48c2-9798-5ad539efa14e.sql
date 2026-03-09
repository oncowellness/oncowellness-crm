
-- ============================================================
-- SPRINT 2: Harden permissive RLS policies
-- ============================================================

-- ─── 1. CLINICAL_NOTES ──────────────────────────────────────
-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert clinical notes" ON public.clinical_notes;

-- New: Only assigned staff or admins can insert notes
CREATE POLICY "Assigned staff or admins insert clinical notes"
  ON public.clinical_notes FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- ─── 2. SESSIONS ────────────────────────────────────────────
-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert sessions" ON public.sessions;

-- New: Only assigned staff or admins can insert sessions
CREATE POLICY "Assigned staff or admins insert sessions"
  ON public.sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Staff can update sessions" ON public.sessions;

-- New: Only assigned staff or admins can update sessions
CREATE POLICY "Assigned staff or admins update sessions"
  ON public.sessions FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- ─── 3. PATIENTS INSERT ─────────────────────────────────────
-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert patients" ON public.patients;

-- New: Only admins/directors can create patients
CREATE POLICY "Admins can insert patients"
  ON public.patients FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
  );

-- ─── 4. CLINICAL_TESTS ──────────────────────────────────────
-- Drop overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert clinical tests" ON public.clinical_tests;

-- New: Only assigned staff or admins can insert tests
CREATE POLICY "Assigned staff or admins insert clinical tests"
  ON public.clinical_tests FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- Drop overly permissive UPDATE policy
DROP POLICY IF EXISTS "Staff can update clinical tests" ON public.clinical_tests;

-- New: Only assigned staff or admins can update tests
CREATE POLICY "Assigned staff or admins update clinical tests"
  ON public.clinical_tests FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- ─── 5. PATIENT_CONTENT ─────────────────────────────────────
-- Drop overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated can manage patient content" ON public.patient_content;

-- New: Only assigned staff or admins can manage patient content
CREATE POLICY "Assigned staff or admins manage patient content"
  ON public.patient_content FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- ─── 6. CRISIS_ORDERS ───────────────────────────────────────
-- Drop overly permissive ALL policy
DROP POLICY IF EXISTS "Authenticated can manage crisis orders" ON public.crisis_orders;

-- New: Only assigned staff or admins can manage crisis orders
CREATE POLICY "Assigned staff or admins manage crisis orders"
  ON public.crisis_orders FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );

-- ─── 7. ALERTS INSERT (fix the WITH CHECK true) ─────────────
DROP POLICY IF EXISTS "System insert alerts" ON public.alerts;

-- Alerts are inserted by SECURITY DEFINER triggers, but also allow admins
CREATE POLICY "Admins or system insert alerts"
  ON public.alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR public.has_role(auth.uid(), 'director'::app_role)
    OR public.is_assigned_to_patient(auth.uid(), patient_id)
  );
