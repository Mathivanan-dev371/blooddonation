-- Run this in your Supabase SQL Editor to fix the schema error
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS phone_number TEXT;
