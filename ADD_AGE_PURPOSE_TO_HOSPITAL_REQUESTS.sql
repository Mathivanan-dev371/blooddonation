-- Add Patient Age and Purpose to hospital_requests table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'patient_age') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN patient_age INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'purpose') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN purpose TEXT;
    END IF;
END $$;
