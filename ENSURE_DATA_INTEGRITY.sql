-- ==========================================
-- ENSURE DATA INTEGRITY & CONSTRAINTS
-- Run this script in Supabase SQL Editor
-- ==========================================

-- 1. PROFILES (Base User Table)
-- Ensure ID is PK
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_pkey') THEN
        ALTER TABLE public.profiles ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 2. STUDENT DETAILS (Links to Profiles)
-- Remove orphans first
DELETE FROM public.student_details 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Ensure FK to Profiles
DO $$ BEGIN
    -- Drop if exists to ensure correct definition
    ALTER TABLE public.student_details DROP CONSTRAINT IF EXISTS student_details_user_id_fkey;
    
    ALTER TABLE public.student_details
    ADD CONSTRAINT student_details_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 3. HOSPITAL REQUESTS (Created by Hospitals)
-- Remove orphans
DELETE FROM public.hospital_requests 
WHERE hospital_id IS NOT NULL AND hospital_id NOT IN (SELECT id FROM public.profiles);

-- Ensure FK to Profiles
DO $$ BEGIN
    ALTER TABLE public.hospital_requests DROP CONSTRAINT IF EXISTS hospital_requests_hospital_id_fkey;
    
    ALTER TABLE public.hospital_requests
    ADD CONSTRAINT hospital_requests_hospital_id_fkey
    FOREIGN KEY (hospital_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;
END $$;

-- 4. DONATION ATTEMPTS
-- Remove orphans
DELETE FROM public.donation_attempts 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.donation_attempts 
WHERE hospital_id IS NOT NULL AND hospital_id NOT IN (SELECT id FROM public.profiles);

-- Ensure FKs
DO $$ BEGIN
    ALTER TABLE public.donation_attempts DROP CONSTRAINT IF EXISTS donation_attempts_user_id_fkey;
    
    ALTER TABLE public.donation_attempts
    ADD CONSTRAINT donation_attempts_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    -- Hospital ID is optional, but if present must exist
    ALTER TABLE public.donation_attempts DROP CONSTRAINT IF EXISTS donation_attempts_hospital_id_fkey;
    
    ALTER TABLE public.donation_attempts
    ADD CONSTRAINT donation_attempts_hospital_id_fkey
    FOREIGN KEY (hospital_id)
    REFERENCES public.profiles(id)
    ON DELETE SET NULL;
END $$;

-- 5. REQUIREMENT RESPONSES
-- Remove orphans
DELETE FROM public.requirement_responses 
WHERE student_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.requirement_responses
WHERE requirement_id NOT IN (SELECT id FROM public.blood_requirements);

-- Ensure FKs
DO $$ BEGIN
    ALTER TABLE public.requirement_responses DROP CONSTRAINT IF EXISTS requirement_responses_student_id_fkey;
    
    ALTER TABLE public.requirement_responses
    ADD CONSTRAINT requirement_responses_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    ALTER TABLE public.requirement_responses DROP CONSTRAINT IF EXISTS requirement_responses_requirement_id_fkey;
    
    ALTER TABLE public.requirement_responses
    ADD CONSTRAINT requirement_responses_requirement_id_fkey
    FOREIGN KEY (requirement_id)
    REFERENCES public.blood_requirements(id)
    ON DELETE CASCADE;
END $$;

-- 6. HOSPITAL RESPONSE TRACKING
-- Remove orphans
DELETE FROM public.hospital_response_tracking 
WHERE student_id NOT IN (SELECT id FROM public.profiles);

DELETE FROM public.hospital_response_tracking
WHERE request_id NOT IN (SELECT id FROM public.hospital_requests);

-- Ensure FKs
DO $$ BEGIN
    ALTER TABLE public.hospital_response_tracking DROP CONSTRAINT IF EXISTS hospital_response_tracking_student_id_fkey;
    
    ALTER TABLE public.hospital_response_tracking
    ADD CONSTRAINT hospital_response_tracking_student_id_fkey
    FOREIGN KEY (student_id)
    REFERENCES public.profiles(id)
    ON DELETE CASCADE;

    ALTER TABLE public.hospital_response_tracking DROP CONSTRAINT IF EXISTS hospital_response_tracking_request_id_fkey;
    
    ALTER TABLE public.hospital_response_tracking
    ADD CONSTRAINT hospital_response_tracking_request_id_fkey
    FOREIGN KEY (request_id)
    REFERENCES public.hospital_requests(id)
    ON DELETE CASCADE;
END $$;

-- 7. STUDENT DONORS (Legacy/Alternative Table)
-- Just in case it's used
DELETE FROM public.student_donors
WHERE user_id NOT IN (SELECT id FROM auth.users); -- This table links to auth.users in original setup

DO $$ BEGIN
    ALTER TABLE public.student_donors DROP CONSTRAINT IF EXISTS student_donors_user_id_fkey;
    
    ALTER TABLE public.student_donors
    ADD CONSTRAINT student_donors_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;
END $$;

-- VERIFICATION output
SELECT 
    'Constraints Verified' as status,
    (SELECT COUNT(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY') as total_fks;
