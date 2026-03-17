-- RPC Function to notify all users
-- This function fetches all active FCM tokens and returns them
-- Can be expanded to trigger an Edge Function via pg_net if installed.

CREATE OR REPLACE FUNCTION public.notify_all_users(title TEXT, body TEXT)
RETURNS JSON AS $$
DECLARE
    token_list TEXT[];
    user_ids UUID[];
BEGIN
    -- 1. Fetch all active tokens and their corresponding user UUIDs
    SELECT 
        array_agg(fcm_token),
        array_agg(user_id)
    INTO 
        token_list,
        user_ids
    FROM public.fcm_tokens
    WHERE is_active = true;

    -- 2. Log the activity (optional)
    -- INSERT INTO notification_logs (title, body, recipient_count) VALUES (title, body, array_length(token_list, 1));

    -- 3. Return the data so the caller can proceed with the actual FCM send 
    -- (or if configured, use net.http_post to call the Edge Function directly from Postgres)
    RETURN json_build_object(
        'success', true,
        'count', COALESCE(array_length(token_list, 1), 0),
        'tokens', COALESCE(token_list, '{}'::TEXT[]),
        'user_ids', COALESCE(user_ids, '{}'::UUID[])
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Provide access to authenticated users
GRANT EXECUTE ON FUNCTION public.notify_all_users(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_all_users(TEXT, TEXT) TO service_role;

COMMENT ON FUNCTION public.notify_all_users IS 'Fetches all active FCM tokens and associated user UUIDs for broadcast notifications.';
