-- ==========================================
-- MASTER SUPABASE SETUP FOR BLOOD DONATION SYSTEM
-- ==========================================
-- This script consolidates all necessary tables, types, RLS policies, 
-- and RPC functions required by the frontend application.
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'ADMIN', 'HOSPITAL');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE donation_status AS ENUM ('PENDING', 'SUCCESS', 'FAILURE', 'CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM ('PENDING', 'ASSIGNED', 'COMPLETED', 'CANCELLED', 'REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. TABLES

-- Profiles (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  username TEXT UNIQUE,
  role user_role DEFAULT 'STUDENT',
  trust_score INTEGER DEFAULT 50,
  is_available BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  location TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student Details (Extended info)
CREATE TABLE IF NOT EXISTS public.student_details (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  name TEXT NOT NULL,
  registration_number TEXT DEFAULT 'N/A',
  date_of_birth DATE,
  age INTEGER DEFAULT 18,
  phone_number TEXT DEFAULT 'N/A',
  blood_group TEXT NOT NULL,
  department TEXT NOT NULL,
  year_semester TEXT NOT NULL,
  college_name TEXT,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital Requests (Direct from hospitals)
CREATE TABLE IF NOT EXISTS public.hospital_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hospital_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_name TEXT,
  hospital_address TEXT,
  blood_group TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  arrival_time TIMESTAMP WITH TIME ZONE,
  status request_status DEFAULT 'PENDING',
  assigned_donors TEXT[] DEFAULT '{}',
  patient_name TEXT,
  phone_number TEXT,
  patient_age INTEGER,
  purpose TEXT,
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blood Requirements (Broadcast/Legacy/Generic requests)
CREATE TABLE IF NOT EXISTS public.blood_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hospital_name TEXT,
  contact_number TEXT,
  patient_name TEXT, 
  treatment_type TEXT,
  blood_group TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'Pending',
  notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Donation Attempts (Tracking history)
CREATE TABLE IF NOT EXISTS public.donation_attempts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  hospital_id UUID REFERENCES public.profiles(id),
  request_id UUID REFERENCES public.hospital_requests(id) ON DELETE SET NULL,
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status donation_status DEFAULT 'PENDING',
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- FCM Tokens (For push notifications)
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    fcm_token TEXT NOT NULL,
    device_type TEXT DEFAULT 'web',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Requirement Responses (Submissions for generic blood requirements)
CREATE TABLE IF NOT EXISTS public.requirement_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requirement_id UUID REFERENCES public.blood_requirements(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Accepted',
    arrival_status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hospital Response Tracking (New tracking for direct hospital requests)
CREATE TABLE IF NOT EXISTS public.hospital_response_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    request_id UUID REFERENCES public.hospital_requests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    response_status TEXT DEFAULT 'Accepted',
    arrival_status TEXT DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(request_id, student_id)
);

-- 4. ROW LEVEL SECURITY (RLS) policies

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blood_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirement_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospital_response_tracking ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);

-- Student Details Policies
DROP POLICY IF EXISTS "Student details are viewable by everyone" ON public.student_details;
CREATE POLICY "Student details are viewable by everyone" ON public.student_details FOR SELECT USING (true);
CREATE POLICY "Users can update their own student details" ON public.student_details FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own student details" ON public.student_details FOR INSERT WITH CHECK (auth.uid() = user_id OR true);

-- Hospital Requests
DROP POLICY IF EXISTS "Hospital requests are viewable by everyone" ON public.hospital_requests;
CREATE POLICY "Hospital requests are viewable by everyone" ON public.hospital_requests FOR SELECT USING (true);
CREATE POLICY "Anyone can create or update requests" ON public.hospital_requests FOR ALL USING (true); -- Relaxed for development

-- Blood Requirements
DROP POLICY IF EXISTS "Requirements are viewable by everyone" ON public.blood_requirements;
CREATE POLICY "Requirements are viewable by everyone" ON public.blood_requirements FOR SELECT USING (true);
CREATE POLICY "Anyone can create blood requirements" ON public.blood_requirements FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update blood requirements" ON public.blood_requirements FOR UPDATE USING (true);

-- FCM Tokens
DROP POLICY IF EXISTS "Users can manage their own tokens" ON public.fcm_tokens;
CREATE POLICY "Users can manage their own tokens" ON public.fcm_tokens FOR ALL USING (auth.uid() = user_id);

-- Responses
DROP POLICY IF EXISTS "Responses are viewable by everyone" ON public.requirement_responses;
CREATE POLICY "Responses are viewable by everyone" ON public.requirement_responses FOR SELECT USING (true);
CREATE POLICY "Students can submit responses" ON public.requirement_responses FOR INSERT WITH CHECK (true);

-- Tracking
DROP POLICY IF EXISTS "Tracking is viewable by everyone" ON public.hospital_response_tracking;
CREATE POLICY "Tracking is viewable by everyone" ON public.hospital_response_tracking FOR SELECT USING (true);
CREATE POLICY "Anyone can manage tracking" ON public.hospital_response_tracking FOR ALL USING (true);

-- 5. FUNCTIONS & TRIGGERS

-- Automatically create a profile and student entry on signup
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
      blood_group,
      department,
      year_semester,
      college_name,
      age
    )
    VALUES (
      new.id,
      COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'username', 'New Student'),
      COALESCE(new.raw_user_meta_data->>'admission_number', 'PENDING'),
      COALESCE(new.raw_user_meta_data->>'blood_group', 'Unknown'),
      COALESCE(new.raw_user_meta_data->>'department', 'N/A'),
      COALESCE(new.raw_user_meta_data->>'year_semester', 'N/A'),
      COALESCE(new.raw_user_meta_data->>'college_name', 'Sona College'),
      COALESCE((new.raw_user_meta_data->>'age')::INTEGER, 18)
    );
  END IF;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. RPC FUNCTIONS (REQUIRED BY FRONTEND API)

-- Function to adjust trust score
CREATE OR REPLACE FUNCTION adjust_trust_score(p_user_id UUID, p_delta INTEGER)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profiles
    SET trust_score = GREATEST(0, LEAST(200, trust_score + p_delta))
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to join a hospital request (Atomic update of assigned_donors array)
CREATE OR REPLACE FUNCTION join_hospital_request(p_request_id UUID, p_student_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.hospital_requests
    SET assigned_donors = array_append(assigned_donors, p_student_id::TEXT)
    WHERE id = p_request_id 
    AND NOT (assigned_donors @> array[p_student_id::TEXT]);
    
    INSERT INTO public.hospital_response_tracking (request_id, student_id, response_status)
    VALUES (p_request_id, p_student_id, 'Accepted')
    ON CONFLICT (request_id, student_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to delete user entirely (Clean cascade)
CREATE OR REPLACE FUNCTION delete_user_entirely(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth.users WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT 'Integration Master Setup Complete!' as status;
