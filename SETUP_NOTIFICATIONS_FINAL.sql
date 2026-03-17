-- Consolidated Notification Setup
-- 1. Fix fcm_tokens table to work for ALL users (Students, Hospitals, Admins)
-- 2. Create a secure RPC to fetch tokens for broadcasting

-- Ensure the table exists and use auth.users(id) for the reference
-- This allows hospitals and admins to also receive notifications if they have the app
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    fcm_token TEXT NOT NULL,
    device_type TEXT DEFAULT 'web',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(fcm_token);

-- Enable RLS
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policies: Users can manage their own tokens
DROP POLICY IF EXISTS "Users can manage their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can manage their own fcm tokens"
ON public.fcm_tokens FOR ALL
USING (auth.uid() = user_id);

-- RPC Function: get_tokens_for_notification
-- This function bypasses RLS (SECURITY DEFINER) to fetch tokens for notifications.
-- It can fetch ALL active tokens or tokens for specific user IDs.
CREATE OR REPLACE FUNCTION public.get_tokens_for_notification(p_user_ids UUID[] DEFAULT NULL)
RETURNS TABLE (fcm_token TEXT, user_id UUID) AS $$
BEGIN
    IF p_user_ids IS NULL OR array_length(p_user_ids, 1) IS NULL THEN
        -- Fetch ALL active tokens for broadcast
        RETURN QUERY 
        SELECT t.fcm_token, t.user_id 
        FROM public.fcm_tokens t
        WHERE t.is_active = true;
    ELSE
        -- Fetch tokens for SPECIFIC users
        RETURN QUERY 
        SELECT t.fcm_token, t.user_id 
        FROM public.fcm_tokens t
        WHERE t.user_id = ANY(p_user_ids)
        AND t.is_active = true;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION public.get_tokens_for_notification(UUID[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_tokens_for_notification(UUID[]) TO service_role;

-- Legacy support for notify_all_users if needed
CREATE OR REPLACE FUNCTION public.notify_all_users(title TEXT DEFAULT '', body TEXT DEFAULT '')
RETURNS JSON AS $$
DECLARE
    token_list TEXT[];
    user_ids UUID[];
BEGIN
    SELECT 
        array_agg(t.fcm_token),
        array_agg(t.user_id)
    INTO 
        token_list,
        user_ids
    FROM public.fcm_tokens t
    WHERE t.is_active = true;

    RETURN json_build_object(
        'success', true,
        'count', COALESCE(array_length(token_list, 1), 0),
        'tokens', COALESCE(token_list, '{}'::TEXT[]),
        'user_ids', COALESCE(user_ids, '{}'::UUID[])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.notify_all_users(TEXT, TEXT) TO authenticated;

SELECT 'Notification setup improved successfully!' as status;
