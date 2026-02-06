-- Function to allow administrators to permanently delete a user and their authentication credentials.
-- This function must be executed in the Supabase SQL Editor by an administrator.
-- It uses SECURITY DEFINER to bypass the normal restriction where a client cannot delete another user from auth.users.

CREATE OR REPLACE FUNCTION public.delete_user_entirely(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  -- Check if the user exists in auth.users
  -- deleting from auth.users will cascade to public.profiles, student_details, etc.
  -- because of the ON DELETE CASCADE relationships defined in the schema.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

-- Note: In a production app, you would add logic here to verify the caller is truly an admin
-- using (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'ADMIN'
