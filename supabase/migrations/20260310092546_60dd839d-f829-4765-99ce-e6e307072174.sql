
-- =============================================
-- FIX 1: Secure invitation token lookup via RPC
-- =============================================

-- Drop the open anon policy that exposes all invitations
DROP POLICY IF EXISTS "Public can read by token" ON public.invitations;

-- Create a secure RPC that only returns a single invitation by token
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token uuid)
RETURNS TABLE (id uuid, email text, role app_role, expires_at timestamptz, accepted_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.email, i.role, i.expires_at, i.accepted_at
  FROM public.invitations i
  WHERE i.token = _token AND i.accepted_at IS NULL;
$$;

-- =============================================
-- FIX 2: Enforce account suspension at RLS level
-- =============================================

-- Create helper function to check if user is active (not suspended)
CREATE OR REPLACE FUNCTION public.is_active_user(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT NOT COALESCE(suspended, false) FROM public.profiles WHERE user_id = _uid;
$$;

-- Update clinical table policies to enforce suspension check
-- PATIENTS table
DROP POLICY IF EXISTS "Directors see all patients" ON public.patients;
CREATE POLICY "Directors see all patients" ON public.patients
  FOR SELECT TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Staff sees assigned patients" ON public.patients;
CREATE POLICY "Staff sees assigned patients" ON public.patients
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), id));

DROP POLICY IF EXISTS "Admins can insert patients" ON public.patients;
CREATE POLICY "Admins can insert patients" ON public.patients
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role))
  );

DROP POLICY IF EXISTS "Staff can update assigned patients" ON public.patients;
CREATE POLICY "Staff can update assigned patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR is_assigned_to_patient(auth.uid(), id))
  );

-- CLINICAL_TESTS table
DROP POLICY IF EXISTS "Authenticated can read clinical tests" ON public.clinical_tests;
CREATE POLICY "Authenticated can read clinical tests" ON public.clinical_tests
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Assigned staff or admins insert clinical tests" ON public.clinical_tests;
CREATE POLICY "Assigned staff or admins insert clinical tests" ON public.clinical_tests
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

DROP POLICY IF EXISTS "Assigned staff or admins update clinical tests" ON public.clinical_tests;
CREATE POLICY "Assigned staff or admins update clinical tests" ON public.clinical_tests
  FOR UPDATE TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

-- CLINICAL_NOTES table
DROP POLICY IF EXISTS "Authenticated can read clinical notes" ON public.clinical_notes;
CREATE POLICY "Authenticated can read clinical notes" ON public.clinical_notes
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Assigned staff or admins insert clinical notes" ON public.clinical_notes;
CREATE POLICY "Assigned staff or admins insert clinical notes" ON public.clinical_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

-- SESSIONS table
DROP POLICY IF EXISTS "Authenticated can read sessions" ON public.sessions;
CREATE POLICY "Authenticated can read sessions" ON public.sessions
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Assigned staff or admins insert sessions" ON public.sessions;
CREATE POLICY "Assigned staff or admins insert sessions" ON public.sessions
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

DROP POLICY IF EXISTS "Assigned staff or admins update sessions" ON public.sessions;
CREATE POLICY "Assigned staff or admins update sessions" ON public.sessions
  FOR UPDATE TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

-- ALERTS table
DROP POLICY IF EXISTS "Directors see all alerts" ON public.alerts;
CREATE POLICY "Directors see all alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  );

DROP POLICY IF EXISTS "Staff sees assigned patient alerts" ON public.alerts;
CREATE POLICY "Staff sees assigned patient alerts" ON public.alerts
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Admins or system insert alerts" ON public.alerts;
CREATE POLICY "Admins or system insert alerts" ON public.alerts
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

DROP POLICY IF EXISTS "Staff can resolve alerts" ON public.alerts;
CREATE POLICY "Staff can resolve alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'director'::app_role) OR has_role(auth.uid(), 'admin'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

-- CLINICAL_EVENTS table
DROP POLICY IF EXISTS "Admins read all clinical events" ON public.clinical_events;
CREATE POLICY "Admins read all clinical events" ON public.clinical_events
  FOR SELECT TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role))
  );

DROP POLICY IF EXISTS "Staff reads assigned patient events" ON public.clinical_events;
CREATE POLICY "Staff reads assigned patient events" ON public.clinical_events
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Staff or admins insert clinical events" ON public.clinical_events;
CREATE POLICY "Staff or admins insert clinical events" ON public.clinical_events
  FOR INSERT TO authenticated
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );

-- CLINICAL_GOALS table
DROP POLICY IF EXISTS "Admins manage clinical goals" ON public.clinical_goals;
CREATE POLICY "Admins manage clinical goals" ON public.clinical_goals
  FOR ALL TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role))
  )
  WITH CHECK (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role))
  );

DROP POLICY IF EXISTS "Staff reads assigned patient goals" ON public.clinical_goals;
CREATE POLICY "Staff reads assigned patient goals" ON public.clinical_goals
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Staff manages assigned patient goals" ON public.clinical_goals;
CREATE POLICY "Staff manages assigned patient goals" ON public.clinical_goals
  FOR INSERT TO authenticated
  WITH CHECK (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

DROP POLICY IF EXISTS "Staff updates assigned patient goals" ON public.clinical_goals;
CREATE POLICY "Staff updates assigned patient goals" ON public.clinical_goals
  FOR UPDATE TO authenticated
  USING (is_active_user(auth.uid()) AND is_assigned_to_patient(auth.uid(), patient_id));

-- CRISIS_ORDERS table
DROP POLICY IF EXISTS "Authenticated can read crisis orders" ON public.crisis_orders;
CREATE POLICY "Authenticated can read crisis orders" ON public.crisis_orders
  FOR SELECT TO authenticated
  USING (is_active_user(auth.uid()));

DROP POLICY IF EXISTS "Assigned staff or admins manage crisis orders" ON public.crisis_orders;
CREATE POLICY "Assigned staff or admins manage crisis orders" ON public.crisis_orders
  FOR ALL TO authenticated
  USING (
    is_active_user(auth.uid()) AND
    (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role) OR is_assigned_to_patient(auth.uid(), patient_id))
  );
