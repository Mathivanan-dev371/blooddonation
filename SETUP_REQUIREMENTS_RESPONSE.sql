-- Create requirement responses table if not exists
CREATE TABLE IF NOT EXISTS public.requirement_responses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  requirement_id UUID REFERENCES public.blood_requirements(id) ON DELETE CASCADE,
  student_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'Accepted', -- Accepted, Declined, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requirement_id, student_id)
);

-- Enable RLS
ALTER TABLE public.requirement_responses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Students can insert their own responses" ON public.requirement_responses;
DROP POLICY IF EXISTS "Users can view their own responses" ON public.requirement_responses;
DROP POLICY IF EXISTS "Admins can view all responses" ON public.requirement_responses;

-- Create Policies
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
