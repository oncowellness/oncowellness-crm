
-- ============================================================
-- SPRINT 3: Traceability fields + admin role management
-- ============================================================

-- ─── 1. PATIENTS: active_status ──────────────────────────────
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS active_status boolean NOT NULL DEFAULT true;

-- ─── 2. SESSIONS: completed_at ───────────────────────────────
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Update on_session_completed to set completed_at
CREATE OR REPLACE FUNCTION public.on_session_completed()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  staff_tarifa NUMERIC(10,2);
BEGIN
  IF NEW.status = 'realizada' AND (OLD.status IS NULL OR OLD.status != 'realizada') THEN
    -- Set completed_at timestamp
    NEW.completed_at = now();

    IF NEW.staff_id IS NOT NULL THEN
      SELECT tarifa_fijo INTO staff_tarifa FROM public.profiles WHERE user_id = NEW.staff_id;

      INSERT INTO public.incentives (staff_id, concepto, monto, descripcion, session_id, mes_liquidacion)
      VALUES (
        NEW.staff_id,
        'fijo',
        COALESCE(staff_tarifa, 0),
        'Sesión ' || NEW.programa_code || ' completada',
        NEW.id,
        date_trunc('month', NEW.fecha)::date
      );

      UPDATE public.profiles
      SET total_acumulado = total_acumulado + COALESCE(staff_tarifa, 0)
      WHERE user_id = NEW.staff_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

-- Change trigger to BEFORE UPDATE so we can modify NEW.completed_at
DROP TRIGGER IF EXISTS trg_on_session_completed ON public.sessions;
CREATE TRIGGER trg_on_session_completed
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.on_session_completed();

-- ─── 3. CRISIS_ORDERS: resolved_by, resolved_at ─────────────
ALTER TABLE public.crisis_orders
  ADD COLUMN IF NOT EXISTS resolved_by uuid,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

-- ─── 4. USER_ROLES: Allow admin to manage roles ─────────────
-- Currently only director can manage; add admin
DROP POLICY IF EXISTS "Directors can manage roles" ON public.user_roles;

CREATE POLICY "Directors and admins can manage roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'director'::app_role)
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );
