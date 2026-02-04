-- Create a specific table for Blood Requirements to ensure separation of concerns
-- Dropping existing table if it exists to forcefully update schema (BE CAREFUL IN PRODUCTION)
DROP TABLE IF EXISTS public.blood_requirements;

CREATE TABLE public.blood_requirements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  hospital_name TEXT,
  contact_number TEXT,
  patient_name TEXT, 
  treatment_type TEXT,
  blood_group TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT DEFAULT 'Pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.blood_requirements ENABLE ROW LEVEL SECURITY;

-- Allow read access to everyone
CREATE POLICY "Requirements are viewable by everyone" 
ON public.blood_requirements FOR SELECT USING (true);

-- Allow insert access to everyone (for easy testing)
CREATE POLICY "Anyone can create requirements" 
ON public.blood_requirements FOR INSERT WITH CHECK (true);

-- Allow updates (e.g. changing status)
CREATE POLICY "Anyone can update requirements" 
ON public.blood_requirements FOR UPDATE USING (true);
