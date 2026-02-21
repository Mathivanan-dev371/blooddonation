-- Update tables to include 'year' attribute
-- Run this in Supabase SQL Editor

-- 1. Add 'year' to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS year TEXT;

-- 2. Add 'year' to student_details
ALTER TABLE public.student_details ADD COLUMN IF NOT EXISTS year TEXT;

-- 3. Update handle_new_user trigger to include year
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
BEGIN
  assigned_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'STUDENT');

  INSERT INTO public.profiles (id, email, username, role, year)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', 'Unknown'),
    assigned_role,
    new.raw_user_meta_data->>'year'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    year = EXCLUDED.year;

  IF (assigned_role = 'STUDENT') THEN
    INSERT INTO public.student_details (
      user_id,
      name,
      admission_number,
      phone_number,
      blood_group,
      department,
      college_name,
      year,
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
      COALESCE(new.raw_user_meta_data->>'year', 'N/A'),
      COALESCE(new.raw_user_meta_data->>'year', 'N/A'), -- Use year for year_semester too
      'Active'
    )
    ON CONFLICT (user_id) DO UPDATE SET
      name = EXCLUDED.name,
      admission_number = EXCLUDED.admission_number,
      phone_number = EXCLUDED.phone_number,
      blood_group = EXCLUDED.blood_group,
      department = EXCLUDED.department,
      college_name = EXCLUDED.college_name,
      year = EXCLUDED.year,
      year_semester = EXCLUDED.year_semester;
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Profile and Student Details updated with year attribute' as status;
