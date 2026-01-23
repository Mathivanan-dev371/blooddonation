-- FINAL COMPREHENSIVE FIX FOR STUDENT REGISTRATION
-- Execute this in Supabase SQL Editor

-- 1. Ensure 'username' exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'username') THEN
        ALTER TABLE public.profiles ADD COLUMN username TEXT UNIQUE;
    END IF;
END $$;

-- 2. Ensure 'college_name' exists in student_details (mapped from collegeName)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_details' AND column_name = 'college_name') THEN
        ALTER TABLE public.student_details ADD COLUMN college_name TEXT;
    END IF;
END $$;

-- 3. Fix RLS for registration (allow inserts/updates during signup)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Allow insert for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow update for profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user insert" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user update" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow system/user insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow system/user update profiles" ON public.profiles FOR UPDATE USING (true);

-- Student Details Policies
DROP POLICY IF EXISTS "Allow insert for student details" ON public.student_details;
DROP POLICY IF EXISTS "Allow update for student details" ON public.student_details;
DROP POLICY IF EXISTS "Student details are viewable by everyone" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user insert" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user update" ON public.student_details;

CREATE POLICY "Student details are viewable by everyone" ON public.student_details FOR SELECT USING (true);
CREATE POLICY "Allow system/user insert students" ON public.student_details FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow system/user update students" ON public.student_details FOR UPDATE USING (true);

-- 4. Make fields optional with defaults to prevent insert errors
ALTER TABLE public.student_details 
    ALTER COLUMN date_of_birth SET DEFAULT CURRENT_DATE,
    ALTER COLUMN age SET DEFAULT 18,
    ALTER COLUMN phone_number SET DEFAULT 'N/A',
    ALTER COLUMN registration_number SET DEFAULT 'N/A';

ALTER TABLE public.student_details 
    ALTER COLUMN date_of_birth DROP NOT NULL,
    ALTER COLUMN age DROP NOT NULL,
    ALTER COLUMN phone_number DROP NOT NULL,
    ALTER COLUMN registration_number DROP NOT NULL;

-- 5. Fix Triggers (Ensure they don't block manual inserts)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

SELECT 'Database schema and policies updated for student registration!' as status;

-- Add location and email to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
END $$;
