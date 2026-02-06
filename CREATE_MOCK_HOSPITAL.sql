-- CREATE MOCK HOSPITAL PROFILE FOR TESTING
-- Run this script in your Supabase SQL Editor

-- Insert the mock hospital user into profiles table
INSERT INTO profiles (
    id,
    username,
    role,
    email,
    trust_score,
    is_active,
    hospital_name,
    location,
    created_at,
    updated_at
)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'City Hospital',
    'HOSPITAL',
    'hos@gmail.com',
    100,
    true,
    'City General Hospital',
    'Downtown',
    now(),
    now()
)
ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    role = EXCLUDED.role,
    hospital_name = EXCLUDED.hospital_name,
    location = EXCLUDED.location,
    is_active = EXCLUDED.is_active,
    updated_at = now();
