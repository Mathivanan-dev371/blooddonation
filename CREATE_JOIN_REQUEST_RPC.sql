-- Function to allow students to add themselves to a hospital request safely
-- ignoring RLS on the table itself
CREATE OR REPLACE FUNCTION public.join_hospital_request(p_request_id UUID, p_student_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_donors TEXT[];
BEGIN
  -- Get current donors
  SELECT assigned_donors INTO current_donors
  FROM public.hospital_requests
  WHERE id = p_request_id;

  -- Initialize if null
  IF current_donors IS NULL THEN
    current_donors := '{}';
  END IF;

  -- Add if not present
  IF NOT (p_student_id::TEXT = ANY(current_donors)) THEN
    UPDATE public.hospital_requests
    SET assigned_donors = array_append(current_donors, p_student_id::TEXT)
    WHERE id = p_request_id;
  END IF;
END;
$$;
