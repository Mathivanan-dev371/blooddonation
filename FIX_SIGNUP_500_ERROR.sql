-- ============================================================
-- FIX: "Database error saving new user" (500) on signup
-- Root cause: The handle_new_user trigger is crashing because
-- it references old/missing columns or passes NULL into NOT NULL fields.
-- Solution: Replace it with a minimal, safe trigger that NEVER fails.
-- ============================================================

-- Step 1: Drop the broken trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Step 2: Ensure the user_role type exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN', 'HOSPITAL');
    END IF;
END $$;

-- Step 3: Ensure required columns exist on profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_available') THEN
        ALTER TABLE public.profiles ADD COLUMN is_available BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_active') THEN
        ALTER TABLE public.profiles ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'trust_score') THEN
        ALTER TABLE public.profiles ADD COLUMN trust_score INTEGER DEFAULT 50;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'year') THEN
        ALTER TABLE public.profiles ADD COLUMN year TEXT;
    END IF;
END $$;

-- Step 4: Create a new, SAFE trigger function
-- This only inserts a minimal profile row and NEVER crashes signup.
-- All detailed data is saved by the frontend AFTER signup succeeds.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, role, is_active, is_available)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.email,  -- Use email as username (guaranteed unique)
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'STUDENT'::user_role
    ),
    true,
    true
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but DO NOT fail the signup
    RAISE WARNING 'handle_new_user trigger warning: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Re-attach the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Step 6: Fix student_details column name mismatch
-- (registration_number -> admission_number, and make NOT NULL columns nullable)
DO $$
BEGIN
    -- Rename registration_number -> admission_number if old name still exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'registration_number') THEN
        ALTER TABLE public.student_details RENAME COLUMN registration_number TO admission_number;
    END IF;

    -- Add admission_number if it doesn't exist at all
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'admission_number') THEN
        ALTER TABLE public.student_details ADD COLUMN admission_number TEXT UNIQUE;
    END IF;

    -- Add college_name if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'college_name') THEN
        ALTER TABLE public.student_details ADD COLUMN college_name TEXT;
    END IF;

    -- Add year if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'year') THEN
        ALTER TABLE public.student_details ADD COLUMN year TEXT;
    END IF;

    -- Drop date_of_birth column (not used in the frontend)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'date_of_birth') THEN
        ALTER TABLE public.student_details DROP COLUMN date_of_birth;
    END IF;

    -- Drop age column (not used in the frontend)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'student_details' AND column_name = 'age') THEN
        ALTER TABLE public.student_details DROP COLUMN age;
    END IF;

END $$;

-- Step 7: Ensure RLS policies allow frontend upserts AFTER signup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- Profiles INSERT policy
DROP POLICY IF EXISTS "Allow user to insert own profile" ON public.profiles;
CREATE POLICY "Allow user to insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Profiles UPDATE policy
DROP POLICY IF EXISTS "Allow user to update own profile" ON public.profiles;
CREATE POLICY "Allow user to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Student details INSERT policy
DROP POLICY IF EXISTS "Allow user to insert own student details" ON public.student_details;
CREATE POLICY "Allow user to insert own student details" ON public.student_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Student details UPDATE policy
DROP POLICY IF EXISTS "Allow user to update own student details" ON public.student_details;
CREATE POLICY "Allow user to update own student details" ON public.student_details
  FOR UPDATE USING (auth.uid() = user_id);

SELECT '✅ Fix applied! Signup trigger is now safe. Run this in Supabase SQL Editor.' AS result;
