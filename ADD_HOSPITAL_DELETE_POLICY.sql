-- Add DELETE policy to hospital_requests table
-- This allows hospitals to delete their own requests
DO $$
BEGIN
    -- Drop the policy if it exists to avoid errors on re-run
    DROP POLICY IF EXISTS "Hospitals can delete their own requests" ON public.hospital_requests;
    
    -- Create the DELETE policy
    CREATE POLICY "Hospitals can delete their own requests" 
    ON public.hospital_requests 
    FOR DELETE 
    USING (auth.uid() = hospital_id);
END $$;
