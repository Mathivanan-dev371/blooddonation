-- Run this in your Supabase SQL Editor to ensure ALL columns exist in hospital_requests
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS hospital_address TEXT;
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS hospital_name TEXT;
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.hospital_requests ADD COLUMN IF NOT EXISTS status request_status DEFAULT 'PENDING';
