
-- Add administrative/identity fields to patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS identification_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS identification_number text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_street text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS address_extra text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS postal_code text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS city_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS province_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS country_code text DEFAULT 'ES';

-- Unique constraint on identification_number (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_patients_identification_number
  ON public.patients (identification_number)
  WHERE identification_number IS NOT NULL;

-- Add column comments for HIPAA/GDPR documentation
COMMENT ON COLUMN public.patients.identification_type IS 'Type of ID document: DNI, NIE, Pasaporte';
COMMENT ON COLUMN public.patients.identification_number IS 'Unique identification document number (DNI/NIE/Passport)';
COMMENT ON COLUMN public.patients.address_street IS 'Street address line 1';
COMMENT ON COLUMN public.patients.address_extra IS 'Additional address info (floor, door, etc.)';
COMMENT ON COLUMN public.patients.postal_code IS 'Postal/ZIP code';
COMMENT ON COLUMN public.patients.city_name IS 'City name';
COMMENT ON COLUMN public.patients.province_name IS 'Province/State name';
COMMENT ON COLUMN public.patients.country_code IS 'ISO 3166-1 alpha-2 country code';
