-- CREATE REAL HOSPITAL ACCOUNT IN SUPABASE
-- Run this in Supabase SQL Editor

-- Step 1: First, you need to create the auth user via Supabase Dashboard:
-- 1. Go to Authentication > Users
-- 2. Click "Add User" 
-- 3. Email: hos@gmail.com
-- 4. Password: hos123
-- 5. Auto-confirm user: YES
-- 6. Copy the generated UUID (it will look like: abc12345-...)

-- Step 2: After creating the user, run this SQL (replace YOUR_USER_ID with the UUID from step 1)
-- For example: '3fa85f64-5717-4562-b3fc-2c963f66afa6'

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
    'YOUR_USER_ID_HERE', -- Replace this with the UUID from step 1
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
    updated_at = now();
