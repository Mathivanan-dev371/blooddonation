-- ==========================================
-- REMOVE UNUSED TABLES
-- Run this in Supabase SQL Editor
-- ==========================================

-- 1. Remove 'student_donors'
-- This table was part of an earlier/alternative schema but is not used 
-- by the current frontend application (which uses 'student_details' and 'profiles').
DROP TABLE IF EXISTS public.student_donors;

-- 2. Verify Remaining Tables
-- This query lists all tables currently in the public schema
SELECT
    table_name,
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM
    information_schema.tables t
WHERE
    table_schema = 'public'
    -- Exclude system/internal tables if any (usually none in public by default except user ones)
ORDER BY
    table_name;
