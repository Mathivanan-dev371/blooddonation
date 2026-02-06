-- ALIGN HOSPITAL REGISTRY ATTRIBUTES
-- Run this in Supabase SQL Editor

-- 1. Ensure hospitals table matches Admin Panel expectations
DO $$
BEGIN
    -- Ensure names match the 'attributes' mentioned
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hospitals' AND column_name = 'contact_number') THEN
        ALTER TABLE public.hospitals ADD COLUMN contact_number TEXT;
    END IF;

    -- location and name and email already exist in public.hospitals
END $$;

-- 2. Sync profiles table for hospital logins
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'hospital_name') THEN
        ALTER TABLE public.profiles ADD COLUMN hospital_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'contact_number') THEN
        ALTER TABLE public.profiles ADD COLUMN contact_number TEXT;
    END IF;
END $$;
