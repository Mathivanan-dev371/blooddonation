-- ==========================================
-- FIX FOREIGN KEY CONSTRAINT ISSUE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- This script fixes the student_details foreign key constraint violation
-- by ensuring proper table structure and policies

-- 1. First, let's check and fix any orphaned records
-- Delete any student_details records that don't have a matching profile
DELETE FROM public.student_details
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- 2. Ensure the foreign key constraint exists and is correct
-- Drop the constraint if it exists (to recreate it properly)
ALTER TABLE public.student_details 
  DROP CONSTRAINT IF EXISTS student_details_user_id_fkey;

-- Recreate the foreign key constraint with CASCADE
ALTER TABLE public.student_details
  ADD CONSTRAINT student_details_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- 3. Ensure RLS policies allow inserts during registration
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

DROP POLICY IF EXISTS "Student details are viewable by everyone" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user insert students" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user update students" ON public.student_details;
DROP POLICY IF EXISTS "Users can insert their own student details" ON public.student_details;
DROP POLICY IF EXISTS "Users can update their own student details" ON public.student_details;

-- Create permissive policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create permissive policies for student_details
CREATE POLICY "Student details are viewable by everyone" 
  ON public.student_details FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert student details" 
  ON public.student_details FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student details" 
  ON public.student_details FOR UPDATE 
  USING (auth.uid() = user_id);

-- 4. Verify the fix
SELECT 
  'Foreign key constraint fixed!' as status,
  (SELECT COUNT(*) FROM public.profiles) as profile_count,
  (SELECT COUNT(*) FROM public.student_details) as student_details_count,
  (SELECT COUNT(*) FROM public.student_details sd 
   LEFT JOIN public.profiles p ON sd.user_id = p.id 
   WHERE p.id IS NULL) as orphaned_records;
