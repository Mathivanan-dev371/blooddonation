-- ============================================================
-- ADD PHONE NUMBER TO HOSPITAL ACCOUNTS
-- ============================================================

-- Add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='hospital_accounts' AND column_name='phone_number') THEN
        ALTER TABLE public.hospital_accounts ADD COLUMN phone_number text;
    END IF;
END $$;
