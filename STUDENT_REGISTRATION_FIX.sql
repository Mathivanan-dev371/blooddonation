-- Run this in your Supabase SQL Editor to fix student registration

-- First, drop existing restrictive policies on student_details
DROP POLICY IF EXISTS "Users can insert their own student details" ON public.student_details;
DROP POLICY IF EXISTS "Users can update their own student details" ON public.student_details;

-- Create a more permissive insert policy (allows the trigger or direct insert)
CREATE POLICY "Allow insert for authenticated and service role" 
ON public.student_details FOR INSERT 
WITH CHECK (true);

-- Update policy allows users to update their own records
CREATE POLICY "Users can update their own student details" 
ON public.student_details FOR UPDATE 
USING (auth.uid() = user_id);

-- Also ensure profiles table allows inserts
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Allow insert for authenticated and service role" 
ON public.profiles FOR INSERT 
WITH CHECK (true);

-- Verify the student_details table structure matches our needs
-- If college_name column doesn't exist, add it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_details' AND column_name = 'college_name') THEN
        ALTER TABLE public.student_details ADD COLUMN college_name TEXT;
    END IF;
END $$;

-- Make date_of_birth, age, phone_number nullable or set defaults
ALTER TABLE public.student_details 
  ALTER COLUMN date_of_birth SET DEFAULT CURRENT_DATE,
  ALTER COLUMN age SET DEFAULT 18,
  ALTER COLUMN phone_number SET DEFAULT 'N/A';

-- Allow null for these columns if not already
ALTER TABLE public.student_details 
  ALTER COLUMN date_of_birth DROP NOT NULL,
  ALTER COLUMN age DROP NOT NULL,
  ALTER COLUMN phone_number DROP NOT NULL;

SELECT 'Student registration fix applied successfully!' as status;
