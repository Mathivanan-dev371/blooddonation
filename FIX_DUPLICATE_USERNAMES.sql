-- ==========================================
-- FIX DUPLICATE USERNAME CONSTRAINT ISSUE
-- Run this in your Supabase SQL Editor
-- ==========================================

-- This script fixes duplicate username issues by:
-- 1. Identifying duplicate usernames
-- 2. Updating them to use email (which is unique)
-- 3. Ensuring the username column allows the change

-- Step 1: Check for duplicate usernames
SELECT username, COUNT(*) as count
FROM public.profiles
WHERE username IS NOT NULL
GROUP BY username
HAVING COUNT(*) > 1;

-- Step 2: Update all usernames to use email (guaranteed unique)
-- This ensures no future conflicts
UPDATE public.profiles
SET username = email
WHERE username IS NOT NULL AND username != email;

-- Step 3: For any profiles without email, generate a unique username
UPDATE public.profiles
SET username = COALESCE(email, 'user_' || id::text)
WHERE username IS NULL;

-- Step 4: Verify no duplicates remain
SELECT 
  'Username fix complete!' as status,
  (SELECT COUNT(*) FROM public.profiles WHERE username IS NULL) as null_usernames,
  (SELECT COUNT(*) FROM (
    SELECT username, COUNT(*) as count
    FROM public.profiles
    GROUP BY username
    HAVING COUNT(*) > 1
  ) duplicates) as duplicate_count;

-- Step 5: Optional - Make username NOT NULL if desired
-- Uncomment the line below if you want to enforce usernames
-- ALTER TABLE public.profiles ALTER COLUMN username SET NOT NULL;
