-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing objects to allow clean setup (WARNING: DELETES DATA)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.donation_attempts;
DROP TABLE IF EXISTS public.hospital_requests;
DROP TABLE IF EXISTS public.student_donors;
DROP TABLE IF EXISTS public.student_details;
DROP TABLE IF EXISTS public.profiles;

DROP TYPE IF EXISTS user_role;
DROP TYPE IF EXISTS donation_status;
DROP TYPE IF EXISTS request_status;

-- Create Enum Types
CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN', 'HOSPITAL');
CREATE TYPE donation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILURE', 'CANCELLED');
CREATE TYPE request_status AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED');

-- Create Profiles Table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  role user_role DEFAULT 'STUDENT',
  trust_score INTEGER DEFAULT 50,
  is_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Student Details Table (legacy)
CREATE TABLE public.student_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL, -- Renamed from full_name
  registration_number TEXT UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  age INTEGER NOT NULL,
  phone_number TEXT NOT NULL,
  blood_group TEXT NOT NULL,
  department TEXT NOT NULL,
  year_semester TEXT NOT NULL, -- Combined year and semester
  status TEXT DEFAULT 'Active', -- Added status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Student Donors Table (new simplified registration)
CREATE TABLE public.student_donors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  admission_number TEXT UNIQUE NOT NULL,
  blood_group TEXT NOT NULL,
  college_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE public.hospital_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hospital_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_name TEXT,
  hospital_address TEXT,
  blood_group TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  status request_status DEFAULT 'PENDING',
  assigned_donors TEXT[] DEFAULT '{}', -- Array of User IDs (Strings)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Donation Attempts Table
CREATE TABLE public.donation_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.profiles(id), -- Can be null if generic
  request_id UUID REFERENCES public.hospital_requests(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status donation_status DEFAULT 'PENDING',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_attempts ENABLE ROW LEVEL SECURITY;

-- Create Policies

-- Profiles: Users can view their own profile. Public access to some fields might be needed for discovery.
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Student Details: Viewable by everyone (for donor search), editable by owner
CREATE POLICY "Student details are viewable by everyone" 
ON public.student_details FOR SELECT USING (true);

CREATE POLICY "Users can update their own student details" 
ON public.student_details FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student details" 
ON public.student_details FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Student Donors: Viewable by everyone, insertable/editable by owner
CREATE POLICY "Student donors are viewable by everyone" 
ON public.student_donors FOR SELECT USING (true);

CREATE POLICY "Users can insert their own student donor record" 
ON public.student_donors FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student donor record" 
ON public.student_donors FOR UPDATE USING (auth.uid() = user_id);

-- Hospital Requests
CREATE POLICY "Hospital requests are viewable by everyone" 
ON public.hospital_requests FOR SELECT USING (true);

CREATE POLICY "Hospitals can create requests" 
ON public.hospital_requests FOR INSERT WITH CHECK (auth.uid() = hospital_id);

CREATE POLICY "Hospitals can update their requests" 
ON public.hospital_requests FOR UPDATE USING (auth.uid() = hospital_id);

-- Donation Attempts
CREATE POLICY "Users can view their own donations" 
ON public.donation_attempts FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create donation attempts" 
ON public.donation_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own donation attempts" 
ON public.donation_attempts FOR UPDATE USING (auth.uid() = user_id);


-- Trigger to create profile after signup
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
    new.raw_user_meta_data->>'username', 
    assigned_role
  );

  IF (assigned_role = 'STUDENT') THEN
    INSERT INTO public.student_details (
      user_id,
      name,
      registration_number,
      date_of_birth,
      age,
      phone_number,
      blood_group,
      department,
      year_semester,
      status
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'registration_number', 'PENDING-' || new.id),
      COALESCE(NULLIF(new.raw_user_meta_data->>'date_of_birth', '')::DATE, CURRENT_DATE),
      COALESCE(NULLIF(new.raw_user_meta_data->>'age', '')::INTEGER, 0),
      COALESCE(new.raw_user_meta_data->>'phone_number', 'N/A'),
      COALESCE(new.raw_user_meta_data->>'blood_group', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'department', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'year_semester', 'N/A'),
      'Active'
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
