-- Diagnostic script to check foreign key constraints and data integrity
-- Run this in your Supabase SQL Editor

-- 1. Check if the foreign key constraint exists
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='student_details'
  AND kcu.column_name='user_id';

-- 2. Check for orphaned records (student_details with no matching profile)
SELECT sd.id, sd.user_id, sd.name
FROM public.student_details sd
LEFT JOIN public.profiles p ON sd.user_id = p.id
WHERE p.id IS NULL;

-- 3. Check profiles table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- 4. Check student_details table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'student_details'
ORDER BY ordinal_position;

-- 5. Count records in each table
SELECT 
  (SELECT COUNT(*) FROM public.profiles) as profile_count,
  (SELECT COUNT(*) FROM public.student_details) as student_details_count;
