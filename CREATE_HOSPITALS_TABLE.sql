-- Create a dedicated hospitals table to avoid Auth dependency
CREATE TABLE IF NOT EXISTS public.hospitals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist (to be safe)
DROP POLICY IF EXISTS "Hospitals are viewable by everyone" ON public.hospitals;
DROP POLICY IF EXISTS "Allow all for admin" ON public.hospitals;

-- Simple policies for public/admin access
CREATE POLICY "Hospitals are viewable by everyone" ON public.hospitals FOR SELECT USING (true);
CREATE POLICY "Allow all for everyone" ON public.hospitals FOR ALL USING (true) WITH CHECK (true);

-- Notification that schema is ready
SELECT 'Hospitals table created and configured!' as status;
