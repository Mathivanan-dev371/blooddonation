-- Database function and automation to increment student years every June
-- Run this in your Supabase SQL Editor

-- 1. Create the function that performs the increment
CREATE OR REPLACE FUNCTION public.increment_student_years()
RETURNS void AS $$
BEGIN
    -- Update student_details table
    UPDATE public.student_details
    SET 
        year = CASE 
            WHEN year = 'I Year' THEN 'II Year'
            WHEN year = 'II Year' THEN 'III Year'
            WHEN year = 'III Year' THEN 'IV Year'
            WHEN year = 'IV Year' THEN 'Alumni'
            ELSE year
        END,
        year_semester = CASE 
            WHEN year_semester = 'I Year' THEN 'II Year'
            WHEN year_semester = 'II Year' THEN 'III Year'
            WHEN year_semester = 'III Year' THEN 'IV Year'
            WHEN year_semester = 'IV Year' THEN 'Alumni'
            ELSE year_semester
        END;

    -- Update profiles table for consistency
    UPDATE public.profiles
    SET year = CASE 
        WHEN year = 'I Year' THEN 'II Year'
        WHEN year = 'II Year' THEN 'III Year'
        WHEN year = 'III Year' THEN 'IV Year'
        WHEN year = 'IV Year' THEN 'Alumni'
        ELSE year
    END
    WHERE role = 'STUDENT';

    RAISE NOTICE 'Student years incremented successfully.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable the pg_cron extension if not already enabled
-- Note: You may need SuperUser permissions for this, usually available in Supabase SQL Editor
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the function to run on June 1st at 00:00 every year
-- Cron format: min hour day month day_of_week
-- '0 0 1 6 *' means 00:00 on the 1st day of June
SELECT cron.schedule('increment-student-years-june', '0 0 1 6 *', 'SELECT public.increment_student_years()');

-- For manual testing, you can run:
-- SELECT public.increment_student_years();

SELECT 'Automation scheduled: Student years will increment every June 1st' as status;
