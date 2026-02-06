-- ==========================================
-- MASTER FIX SCRIPT
-- Run this in your Supabase SQL Editor to fix missing tables and permissions
-- ==========================================

-- 1. Create the requirement_responses table (for Students accepting Admin requests)
CREATE TABLE IF NOT EXISTS public.requirement_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requirement_id UUID REFERENCES public.blood_requirements(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Accepted', -- Accepted, Declined, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requirement_id, student_id)
);

-- 2. Enable Security (RLS)
ALTER TABLE public.requirement_responses ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies (Who can do what)
-- Allow students to add their own response
DROP POLICY IF EXISTS "Students can insert their own responses" ON public.requirement_responses;
CREATE POLICY "Students can insert their own responses" 
ON public.requirement_responses FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Allow students to view their own responses
DROP POLICY IF EXISTS "Users can view their own responses" ON public.requirement_responses;
CREATE POLICY "Users can view their own responses" 
ON public.requirement_responses FOR SELECT 
USING (auth.uid() = student_id);

-- Allow Admins to view all responses
DROP POLICY IF EXISTS "Admins can view all responses" ON public.requirement_responses;
CREATE POLICY "Admins can view all responses" 
ON public.requirement_responses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);

-- 4. Create Function for Hospital Requests (For Students accepting Hospital requests)
CREATE OR REPLACE FUNCTION public.join_hospital_request(p_request_id UUID, p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_donors TEXT[];
BEGIN
  -- Get current donors
  SELECT assigned_donors INTO current_donors
  FROM public.hospital_requests
  WHERE id = p_request_id;

  -- Initialize if null
  IF current_donors IS NULL THEN
    current_donors := '{}';
  END IF;

  -- Add if not present
  IF NOT (p_student_id::TEXT = ANY(current_donors)) THEN
    UPDATE public.hospital_requests
    SET assigned_donors = array_append(current_donors, p_student_id::TEXT)
    WHERE id = p_request_id;
  END IF;
END;
$$;
