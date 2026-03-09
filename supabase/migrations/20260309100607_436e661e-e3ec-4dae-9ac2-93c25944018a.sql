
-- =============================================
-- ONCOWELLNESS CRM - COMPLETE DATABASE SCHEMA
-- =============================================

-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'fisioterapeuta', 'psicologo', 'nutricionista', 'director');
CREATE TYPE public.phase_journey AS ENUM ('F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8');
CREATE TYPE public.mind_state_enum AS ENUM ('Activo', 'Ansioso', 'Depresivo', 'Resiliente', 'Vulnerable');
CREATE TYPE public.alert_status_enum AS ENUM ('verde', 'amarillo', 'rojo');
CREATE TYPE public.test_type AS ENUM ('30STS', 'TUG', 'Handgrip', '6MWT', 'PHQ-9', 'GAD-7', 'FACIT-F', 'EORTC', 'Transverso', 'Balance');
CREATE TYPE public.program_type AS ENUM ('FX', 'PS', 'NU', 'EO', 'TS');
CREATE TYPE public.session_status AS ENUM ('pendiente', 'confirmada', 'realizada', 'cancelada');
CREATE TYPE public.incentive_status AS ENUM ('pendiente', 'aprobado', 'pagado');
CREATE TYPE public.incentive_concept AS ENUM ('fijo', 'hito_clinico', 'video_rrss', 'bono_extra');

-- Timestamp updater function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =============================================
-- 1. USER ROLES TABLE (security best practice)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Policies for user_roles
CREATE POLICY "Directors can manage roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'director'));
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- 2. PROFILES (Staff)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  email TEXT,
  telefono TEXT,
  especialidad TEXT,
  tarifa_fijo NUMERIC(10,2) DEFAULT 0,
  total_acumulado NUMERIC(10,2) DEFAULT 0,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles viewable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nombre, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3. PATIENTS
-- =============================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  edad INTEGER,
  genero TEXT CHECK (genero IN ('M', 'F')),
  email TEXT,
  telefono TEXT,
  diagnostico TEXT,
  tipo_cancer TEXT,
  estadio TEXT,
  oncologo_referente TEXT,
  fecha_diagnostico DATE,
  fase_journey phase_journey NOT NULL DEFAULT 'F1',
  mind_state mind_state_enum DEFAULT 'Activo',
  alert_status alert_status_enum DEFAULT 'verde',
  high_fall_risk BOOLEAN DEFAULT false,
  assigned_staff_ids UUID[] DEFAULT '{}',
  assigned_programs TEXT[] DEFAULT '{}',
  assigned_bundles TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Directors see all; staff sees assigned patients
CREATE POLICY "Directors see all patients" ON public.patients
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Staff sees assigned patients" ON public.patients
  FOR SELECT TO authenticated
  USING (auth.uid() = ANY(assigned_staff_ids));

CREATE POLICY "Authenticated can insert patients" ON public.patients
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Staff can update assigned patients" ON public.patients
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin') OR auth.uid() = ANY(assigned_staff_ids));

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 4. CLINICAL TESTS
-- =============================================
CREATE TABLE public.clinical_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES auth.users(id),
  tipo test_type NOT NULL,
  valor_numerico NUMERIC(10,2),
  valores_json JSONB DEFAULT '{}',
  is_baseline BOOLEAN DEFAULT false,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read clinical tests" ON public.clinical_tests
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert clinical tests" ON public.clinical_tests
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update clinical tests" ON public.clinical_tests
  FOR UPDATE TO authenticated USING (true);

CREATE INDEX idx_clinical_tests_patient ON public.clinical_tests(patient_id);
CREATE INDEX idx_clinical_tests_tipo ON public.clinical_tests(tipo);

-- =============================================
-- 5. SESSIONS
-- =============================================
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  staff_id UUID REFERENCES auth.users(id),
  programa_code TEXT NOT NULL,
  tipo_programa program_type,
  fecha DATE NOT NULL,
  status session_status DEFAULT 'pendiente',
  notas TEXT,
  therapist_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read sessions" ON public.sessions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert sessions" ON public.sessions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Staff can update sessions" ON public.sessions
  FOR UPDATE TO authenticated USING (true);

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_sessions_patient ON public.sessions(patient_id);
CREATE INDEX idx_sessions_staff ON public.sessions(staff_id);

-- =============================================
-- 6. INCENTIVES
-- =============================================
CREATE TABLE public.incentives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES auth.users(id) NOT NULL,
  concepto incentive_concept NOT NULL,
  monto NUMERIC(10,2) NOT NULL,
  estado incentive_status DEFAULT 'pendiente',
  descripcion TEXT,
  session_id UUID REFERENCES public.sessions(id),
  clinical_test_id UUID REFERENCES public.clinical_tests(id),
  mes_liquidacion DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.incentives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Directors manage incentives" ON public.incentives
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view own incentives" ON public.incentives
  FOR SELECT TO authenticated USING (auth.uid() = staff_id);

CREATE TRIGGER update_incentives_updated_at
  BEFORE UPDATE ON public.incentives
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_incentives_staff ON public.incentives(staff_id);
CREATE INDEX idx_incentives_mes ON public.incentives(mes_liquidacion);

-- =============================================
-- 7. CONTENT ITEMS (Manuales/Empowerment)
-- =============================================
CREATE TABLE public.content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('manual', 'kit', 'guia', 'cuaderno', 'video')),
  phases phase_journey[] DEFAULT '{}',
  description TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.content_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read content" ON public.content_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage content" ON public.content_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 8. PATIENT CONTENT (assigned content per patient)
-- =============================================
CREATE TABLE public.patient_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  content_id UUID REFERENCES public.content_items(id) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  sent_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.patient_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read patient content" ON public.patient_content
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage patient content" ON public.patient_content
  FOR ALL TO authenticated USING (true);

-- =============================================
-- 9. CRISIS ORDERS
-- =============================================
CREATE TABLE public.crisis_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  trigger_reason TEXT NOT NULL,
  program TEXT DEFAULT 'PS-01',
  status TEXT CHECK (status IN ('pendiente', 'atendida')) DEFAULT 'pendiente',
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.crisis_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read crisis orders" ON public.crisis_orders
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can manage crisis orders" ON public.crisis_orders
  FOR ALL TO authenticated USING (true);

-- =============================================
-- 10. CLINICAL NOTES
-- =============================================
CREATE TABLE public.clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES auth.users(id),
  author_name TEXT,
  content TEXT NOT NULL,
  tipo TEXT CHECK (tipo IN ('evolucion', 'interconsulta', 'incidencia')) DEFAULT 'evolucion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.clinical_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read clinical notes" ON public.clinical_notes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can insert clinical notes" ON public.clinical_notes
  FOR INSERT TO authenticated WITH CHECK (true);

-- =============================================
-- 11. PROGRAMS TABLE (reference data)
-- =============================================
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  tipo program_type NOT NULL,
  nombre TEXT NOT NULL,
  descripcion TEXT,
  sesiones INTEGER,
  duracion TEXT
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read programs" ON public.programs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage programs" ON public.programs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- 12. BUNDLES TABLE
-- =============================================
CREATE TABLE public.bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  phase phase_journey,
  descripcion TEXT,
  program_codes TEXT[] DEFAULT '{}'
);
ALTER TABLE public.bundles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read bundles" ON public.bundles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage bundles" ON public.bundles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'director') OR public.has_role(auth.uid(), 'admin'));

-- =============================================
-- TRIGGERS: BUSINESS LOGIC
-- =============================================

-- TRIGGER 1: PHQ-9 Alert (>=10 → Alerta Roja + Crisis Order)
CREATE OR REPLACE FUNCTION public.check_phq9_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'PHQ-9' AND NEW.valor_numerico >= 10 THEN
    -- Set patient to red alert
    UPDATE public.patients 
    SET alert_status = 'rojo', mind_state = 'Depresivo'
    WHERE id = NEW.patient_id;
    
    -- Auto-create crisis order
    INSERT INTO public.crisis_orders (patient_id, trigger_reason, program, status)
    VALUES (
      NEW.patient_id,
      'PHQ-9 >= 10 (Puntuación: ' || NEW.valor_numerico || ')',
      'PS-01',
      'pendiente'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_phq9_alert
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW EXECUTE FUNCTION public.check_phq9_alert();

-- TRIGGER 2: TUG Fall Risk (>12s → high_fall_risk = true)
CREATE OR REPLACE FUNCTION public.check_tug_fall_risk()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.tipo = 'TUG' AND NEW.valor_numerico > 12 THEN
    UPDATE public.patients 
    SET high_fall_risk = true
    WHERE id = NEW.patient_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tug_fall_risk
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW EXECUTE FUNCTION public.check_tug_fall_risk();

-- TRIGGER 3: Session completed → insert fixed incentive
CREATE OR REPLACE FUNCTION public.on_session_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_tarifa NUMERIC(10,2);
BEGIN
  IF NEW.status = 'realizada' AND (OLD.status IS NULL OR OLD.status != 'realizada') AND NEW.staff_id IS NOT NULL THEN
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
    
    -- Update accumulated total
    UPDATE public.profiles 
    SET total_acumulado = total_acumulado + COALESCE(staff_tarifa, 0)
    WHERE user_id = NEW.staff_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_session_incentive
  AFTER UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.on_session_completed();

-- TRIGGER 4: Clinical improvement bonus (10% improvement over baseline)
CREATE OR REPLACE FUNCTION public.check_clinical_improvement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  baseline_val NUMERIC(10,2);
  improvement NUMERIC(10,2);
BEGIN
  IF NEW.tipo IN ('6MWT', 'Handgrip', '30STS') AND NEW.staff_id IS NOT NULL THEN
    SELECT valor_numerico INTO baseline_val
    FROM public.clinical_tests
    WHERE patient_id = NEW.patient_id AND tipo = NEW.tipo AND is_baseline = true
    ORDER BY created_at ASC LIMIT 1;
    
    IF baseline_val IS NOT NULL AND baseline_val > 0 THEN
      improvement := ((NEW.valor_numerico - baseline_val) / baseline_val) * 100;
      
      IF improvement >= 10 THEN
        INSERT INTO public.incentives (staff_id, concepto, monto, descripcion, clinical_test_id, mes_liquidacion)
        VALUES (
          NEW.staff_id,
          'hito_clinico',
          50.00,
          'Mejora ' || round(improvement, 1) || '% en ' || NEW.tipo || ' respecto a basal',
          NEW.id,
          date_trunc('month', now())::date
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_clinical_improvement
  AFTER INSERT ON public.clinical_tests
  FOR EACH ROW EXECUTE FUNCTION public.check_clinical_improvement();
