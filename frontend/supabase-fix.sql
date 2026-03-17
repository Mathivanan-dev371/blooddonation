-- ============================================================
-- FIX: Align fcm_tokens table with what the Vercel frontend expects
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- STEP 1: Drop old table if it exists and recreate with correct columns
-- The frontend (api.ts) expects column: fcm_token (not "token")
-- It also uses: user_id, device_type, last_used_at, is_active

DROP TABLE IF EXISTS public.fcm_tokens CASCADE;

CREATE TABLE public.fcm_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    fcm_token text NOT NULL UNIQUE,          -- ← frontend reads this as fcm_token
    device_type text DEFAULT 'mobile',        -- 'mobile', 'web', etc.
    last_used_at timestamp with time zone DEFAULT now(),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their OWN tokens
CREATE POLICY "Users can upsert their own token"
    ON public.fcm_tokens FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Service role can read all (for admin-console.html)
CREATE POLICY "Service role reads all"
    ON public.fcm_tokens FOR SELECT
    TO service_role
    USING (true);


-- ============================================================
-- STEP 2: RPC used by AdminPanel.tsx → broadcastToAll()
-- This fetches tokens bypassing RLS (SECURITY DEFINER)
-- p_user_ids = null → returns ALL tokens
-- p_user_ids = [uuid1, uuid2] → returns tokens for those users
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_tokens_for_notification(
    p_user_ids uuid[] DEFAULT NULL
)
RETURNS TABLE(fcm_token text, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_ids IS NULL THEN
        -- Return ALL active tokens (for global broadcast)
        RETURN QUERY
            SELECT ft.fcm_token, ft.user_id
            FROM public.fcm_tokens ft
            WHERE ft.is_active = true;
    ELSE
        -- Return tokens only for specified user IDs
        RETURN QUERY
            SELECT ft.fcm_token, ft.user_id
            FROM public.fcm_tokens ft
            WHERE ft.user_id = ANY(p_user_ids)
              AND ft.is_active = true;
    END IF;
END;
$$;


-- ============================================================
-- STEP 3: RPC to save token from the Expo app
-- Called from usePushNotifications.ts after app launch
-- ============================================================

CREATE OR REPLACE FUNCTION public.save_fcm_token(
    expo_token text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_uid uuid;
BEGIN
    current_uid := auth.uid();
    
    IF current_uid IS NULL THEN
        -- Unauthenticated user: Insert without user_id, or just update timestamp if exists
        INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
        VALUES (expo_token, 'mobile', now(), true)
        ON CONFLICT (fcm_token) DO UPDATE
            SET last_used_at = now(),
                is_active    = true;
    ELSE
        -- Authenticated user: Insert with user_id, or update to link user_id if token already exists
        INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
        VALUES (current_uid, expo_token, 'mobile', now(), true)
        ON CONFLICT (fcm_token) DO UPDATE
            SET user_id      = EXCLUDED.user_id,
                last_used_at = now(),
                is_active    = true;
    END IF;
END;
$$;


-- ============================================================
-- STEP 4: (Optional) Enable http extension for SQL-based push
-- Go to: Database → Extensions → search "http" → Enable
-- OR run:
-- ============================================================
-- CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;


-- ============================================================
-- STEP 5: Verify
-- Run this after to confirm setup is correct:
-- ============================================================
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'fcm_tokens';
