-- ALIGN STUDENT DETAILS WITH REGISTRATION PAGE ATTRIBUTES
-- Run this in Supabase SQL Editor

-- 1. Rename registration_number to admission_number
ALTER TABLE public.student_details RENAME COLUMN registration_number TO admission_number;

-- 2. Ensure college_name exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'student_details' AND column_name = 'college_name') THEN
        ALTER TABLE public.student_details ADD COLUMN college_name TEXT;
    END IF;
END $$;

-- 3. Remove date_of_birth and age as they are not on the registration page
ALTER TABLE public.student_details DROP COLUMN IF EXISTS date_of_birth;
ALTER TABLE public.student_details DROP COLUMN IF EXISTS age;

-- 4. Update handle_new_user trigger to support all registration fields
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
BEGIN
  assigned_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'STUDENT');

  INSERT INTO public.profiles (id, email, username, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', 'Unknown'),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    role = EXCLUDED.role;

  IF (assigned_role = 'STUDENT') THEN
    INSERT INTO public.student_details (
      user_id,
      name,
      admission_number,
      phone_number,
      blood_group,
      department,
      college_name,
      year_semester,
      status
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'admission_number', 'PENDING-' || new.id),
      COALESCE(new.raw_user_meta_data->>'phone_number', 'N/A'),
      COALESCE(new.raw_user_meta_data->>'blood_group', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'department', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'college_name', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'college_name', 'N/A'), -- Mapping for UI compatibility
      'Active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      admission_number = EXCLUDED.admission_number,
      phone_number = EXCLUDED.phone_number,
      blood_group = EXCLUDED.blood_group,
      department = EXCLUDED.department,
      college_name = EXCLUDED.college_name,
      year_semester = EXCLUDED.year_semester;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
