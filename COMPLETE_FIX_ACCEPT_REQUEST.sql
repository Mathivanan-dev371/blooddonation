-- 1. Fix Hospital Request Joining (RPC to bypass RLS)
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

-- 2. Fix Requirement Responses Table and RLS
CREATE TABLE IF NOT EXISTS public.requirement_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requirement_id UUID REFERENCES public.blood_requirements(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Accepted',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requirement_id, student_id)
);

-- Enable RLS
ALTER TABLE public.requirement_responses ENABLE ROW LEVEL SECURITY;

-- Recreate policies to ensure they are correct
DROP POLICY IF EXISTS "Students can insert their own responses" ON public.requirement_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.requirement_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.requirement_responses;

CREATE POLICY "Students can insert their own responses" 
ON public.requirement_responses FOR INSERT 
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Users can view their own responses" 
ON public.requirement_responses FOR SELECT 
USING (auth.uid() = student_id);

CREATE POLICY "Admins can view all responses" 
ON public.requirement_responses FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'ADMIN'
  )
);
