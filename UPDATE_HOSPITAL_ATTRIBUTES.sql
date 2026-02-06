-- ENHANCE PROFILES AND HOSPITAL ATTRIBUTES
-- Run this in Supabase SQL Editor

-- 1. Ensure location and name exist in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'location') THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'hospital_name') THEN
        ALTER TABLE public.profiles ADD COLUMN hospital_name TEXT;
    END IF;
END $$;

-- 2. Update handle_new_user trigger to handle HOSPITAL metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  assigned_role user_role;
BEGIN
  assigned_role := COALESCE((new.raw_user_meta_data->>'role')::user_role, 'STUDENT');

  INSERT INTO public.profiles (
    id, 
    email, 
    username, 
    role, 
    location, 
    hospital_name
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', new.email), 
    assigned_role,
    new.raw_user_meta_data->>'location',
    new.raw_user_meta_data->>'hospital_name'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    location = EXCLUDED.location,
    hospital_name = EXCLUDED.hospital_name;

  -- Student specific details
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
      COALESCE(new.raw_user_meta_data->>'college_name', 'N/A'),
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
