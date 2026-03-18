-- ============================================================
-- FINAL MASTER FIX: fcm_tokens Table & RPCs
-- ============================================================

-- 1. Ensure table exists with correct columns
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    fcm_token text NOT NULL UNIQUE,
    device_type text DEFAULT 'mobile',
    last_used_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- 2. Handle potential column name mismatch from old migrations
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='fcm_tokens' AND column_name='token') THEN
        ALTER TABLE public.fcm_tokens RENAME COLUMN token TO fcm_token;
    END IF;
END $$;

-- 3. Disable RLS for this table to ensure service_role/admin can always read
-- (Alternatively, you can keep it on and use the policy below, but disabling is safer for this specific table)
ALTER TABLE public.fcm_tokens DISABLE ROW LEVEL SECURITY;

-- 4. Robust RPC to save/update token
-- Handles both guest users and logged-in users.
-- Updates user_id if a guest becomes logged in.
CREATE OR REPLACE FUNCTION public.save_fcm_token(
    expo_token text,
    p_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_uid uuid;
BEGIN
    -- Priority: 1. Passed ID, 2. Authenticated Session ID
    final_uid := COALESCE(p_user_id, auth.uid());
    
    IF final_uid IS NULL THEN
        -- GUEST: Upsert without changing user_id (keep it null or whatever it was)
        INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
        VALUES (expo_token, 'mobile', now(), true)
        ON CONFLICT (fcm_token) DO UPDATE
            SET last_used_at = now(),
                is_active = true;
    ELSE
        -- LOGGED IN: Upsert and FORCE set the user_id
        INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
        VALUES (final_uid, expo_token, 'mobile', now(), true)
        ON CONFLICT (fcm_token) DO UPDATE
            SET user_id = EXCLUDED.user_id,
                last_used_at = now(),
                is_active = true;
    END IF;
END;
$$;

-- 5. RPC to get tokens (fallback for frontend)
CREATE OR REPLACE FUNCTION public.get_tokens_for_notification(
    p_user_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(fcm_token text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_ids IS NULL THEN
        RETURN QUERY SELECT ft.fcm_token, ft.user_id FROM public.fcm_tokens ft WHERE ft.is_active = true;
    ELSE
        RETURN QUERY SELECT ft.fcm_token, ft.user_id FROM public.fcm_tokens ft 
        WHERE (ft.user_id = ANY(p_user_ids) OR ft.id = ANY(p_user_ids)) 
        AND ft.is_active = true;
    END IF;
END;
$$;
