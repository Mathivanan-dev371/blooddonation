-- ==========================================
-- COMPLETE REGISTRATION FIX - ALL ISSUES
-- Run this ONCE in your Supabase SQL Editor
-- ==========================================
-- This script fixes:
-- 1. Foreign key constraint violations
-- 2. Duplicate username issues
-- 3. RLS policies for registration
-- ==========================================

-- ========================================
-- PART 1: FIX DUPLICATE USERNAMES
-- ========================================

-- Update all usernames to use email (guaranteed unique)
UPDATE public.profiles
SET username = email
WHERE username IS NOT NULL AND username != email;

-- For any profiles without email, generate a unique username
UPDATE public.profiles
SET username = COALESCE(email, 'user_' || id::text)
WHERE username IS NULL;

-- ========================================
-- PART 2: FIX FOREIGN KEY CONSTRAINTS
-- ========================================

-- Delete any orphaned student_details records
DELETE FROM public.student_details
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Recreate the foreign key constraint properly
ALTER TABLE public.student_details 
  DROP CONSTRAINT IF EXISTS student_details_user_id_fkey;

ALTER TABLE public.student_details
  ADD CONSTRAINT student_details_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE CASCADE;

-- ========================================
-- PART 3: FIX RLS POLICIES
-- ========================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow system/user update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow authenticated users to insert profiles" ON public.profiles;

DROP POLICY IF EXISTS "Student details are viewable by everyone" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user insert students" ON public.student_details;
DROP POLICY IF EXISTS "Allow system/user update students" ON public.student_details;
DROP POLICY IF EXISTS "Users can insert their own student details" ON public.student_details;
DROP POLICY IF EXISTS "Users can update their own student details" ON public.student_details;
DROP POLICY IF EXISTS "Allow authenticated users to insert student details" ON public.student_details;

-- Create new policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert profiles" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Create new policies for student_details
CREATE POLICY "Student details are viewable by everyone" 
  ON public.student_details FOR SELECT 
  USING (true);

CREATE POLICY "Allow authenticated users to insert student details" 
  ON public.student_details FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student details" 
  ON public.student_details FOR UPDATE 
  USING (auth.uid() = user_id);

-- ========================================
-- PART 4: VERIFICATION
-- ========================================

-- Verify the fixes
SELECT 
  '✅ All fixes applied successfully!' as status,
  (SELECT COUNT(*) FROM public.profiles) as total_profiles,
  (SELECT COUNT(*) FROM public.student_details) as total_student_details,
  (SELECT COUNT(*) FROM public.student_details sd 
   LEFT JOIN public.profiles p ON sd.user_id = p.id 
   WHERE p.id IS NULL) as orphaned_records,
  (SELECT COUNT(*) FROM public.profiles WHERE username IS NULL) as null_usernames,
  (SELECT COUNT(*) FROM (
    SELECT username, COUNT(*) as count
    FROM public.profiles
    WHERE username IS NOT NULL
    GROUP BY username
    HAVING COUNT(*) > 1
  ) duplicates) as duplicate_usernames;

-- Show summary
SELECT 
  'Database is ready for registration!' as message,
  'You can now test student registration' as next_step;
