
-- Add new program_type enum values
ALTER TYPE public.program_type ADD VALUE IF NOT EXISTS 'TO';
ALTER TYPE public.program_type ADD VALUE IF NOT EXISTS 'SX';
ALTER TYPE public.program_type ADD VALUE IF NOT EXISTS 'PA';
ALTER TYPE public.program_type ADD VALUE IF NOT EXISTS 'ED';
ALTER TYPE public.program_type ADD VALUE IF NOT EXISTS 'PI';

-- Add new columns to programs table
ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS tipo_intervencion text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS objetivos text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sintomas text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS momento_journey text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS mind_state_paciente text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS contenidos text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS frecuencia text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS duracion_semanas numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS perfil_paciente text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS recursos text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS modalidad text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS precio_sesion numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS coste_sesion numeric(10,2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS canal_captacion text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS indicadores_resultado text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS productos_asociados text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS paquetes_relacionados text DEFAULT NULL;
