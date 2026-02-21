-- Add notification tracking to blood requests
DO $$
BEGIN
    -- 1. Update hospital_requests table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospital_requests' AND column_name = 'notification_sent') THEN
        ALTER TABLE public.hospital_requests ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
    END IF;

    -- 2. Update blood_requirements table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'blood_requirements' AND column_name = 'notification_sent') THEN
        ALTER TABLE public.blood_requirements ADD COLUMN notification_sent BOOLEAN DEFAULT FALSE;
    END IF;
END $$;
