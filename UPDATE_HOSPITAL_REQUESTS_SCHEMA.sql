-- Add Patient Name and Phone Number to hospital_requests table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'patient_name') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN patient_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'phone_number') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN phone_number TEXT;
    END IF;
END $$;
