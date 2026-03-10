
-- Add new PROMs test types to the test_type enum
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'Distress';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'ISI';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'MQOL';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'BIS';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'Rosenberg';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'BFI';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'MFI';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'DASH';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'LEFS';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'LYMQOL';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'IPAQ';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'EVA';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'BPI';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'FSFI';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'IIEF';
ALTER TYPE public.test_type ADD VALUE IF NOT EXISTS 'ICIQ-SF';
