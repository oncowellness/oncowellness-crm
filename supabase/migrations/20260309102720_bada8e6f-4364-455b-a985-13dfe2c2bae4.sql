
-- System governance table for emergency lockdown
CREATE TABLE public.system_governance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  emergency_lock_active boolean NOT NULL DEFAULT false,
  locked_by uuid REFERENCES auth.users(id),
  locked_at timestamptz,
  reason text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Insert default row
INSERT INTO public.system_governance (id, emergency_lock_active) 
VALUES ('00000000-0000-0000-0000-000000000001', false);

ALTER TABLE public.system_governance ENABLE ROW LEVEL SECURITY;

-- Everyone can read governance state
CREATE POLICY "Anyone can read governance" ON public.system_governance
FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "Admins can update governance" ON public.system_governance
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role)
);

-- Audit logs table (immutable)
CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_email text,
  action_type text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  patient_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Authenticated can insert audit logs
CREATE POLICY "Authenticated can insert audit logs" ON public.audit_logs
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Admins can read all audit logs
CREATE POLICY "Admins can read audit logs" ON public.audit_logs
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'director'::app_role)
);

-- Staff can read own audit logs
CREATE POLICY "Staff can read own audit logs" ON public.audit_logs
FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for system_governance (for instant lockdown propagation)
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_governance;
