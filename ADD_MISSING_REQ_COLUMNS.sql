-- Add missing columns to hospital_requests and blood_requirements tables
DO $$
BEGIN
    -- 1. Update hospital_requests table (For requests created by Hospitals)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'patient_name') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN patient_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'phone_number') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN phone_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'arrival_time') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN arrival_time TEXT;
    END IF;

     IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'treatment_type') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN treatment_type TEXT DEFAULT 'Emergency';
    END IF;

    -- 2. Update blood_requirements table (For requests created by Admin)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blood_requirements' AND column_name = 'hospital_name') THEN
        ALTER TABLE public.blood_requirements ADD COLUMN hospital_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blood_requirements' AND column_name = 'contact_number') THEN
        ALTER TABLE public.blood_requirements ADD COLUMN contact_number TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blood_requirements' AND column_name = 'patient_name') THEN
        ALTER TABLE public.blood_requirements ADD COLUMN patient_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blood_requirements' AND column_name = 'treatment_type') THEN
        ALTER TABLE public.blood_requirements ADD COLUMN treatment_type TEXT;
    END IF;

END $$;
