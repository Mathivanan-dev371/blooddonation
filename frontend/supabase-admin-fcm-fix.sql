-- Migration: Master Version for save_fcm_token (Resilience + Dedicated Admin Table)
-- Resolves "Could not choose the best candidate" error by dropping all overloads.

-- 1. Create Dedicated Admin Push Token Table (for maximum reliability)
CREATE TABLE IF NOT EXISTS public.admin_push_tokens (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id text NOT NULL, -- Flexible ID (uuid or username)
    fcm_token text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 2. Ensure columns and forensic log table exist
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS fcm_admin text;
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS fcm_hospital text;

CREATE TABLE IF NOT EXISTS public.fcm_debug_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    received_id text,
    matched_admin boolean DEFAULT false,
    matched_hosp boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- 3. Clean up ALL old overloads to fix function ambiguity
DROP FUNCTION IF EXISTS public.save_fcm_token(text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text);

-- 4. High-resilience storage function
CREATE OR REPLACE FUNCTION public.save_fcm_token(
    expo_token text,
    p_user_id text DEFAULT NULL,
    p_device_type text DEFAULT 'mobile'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    final_id text;
    final_uuid uuid;
    found_admin boolean := false;
    found_hosp boolean := false;
BEGIN
    final_id := COALESCE(p_user_id, auth.uid()::text);
    IF final_id IS NULL OR final_id = '' THEN RETURN; END IF;

    -- A. Standard upsert to global fcm_tokens table
    BEGIN
        final_uuid := final_id::uuid;
        IF EXISTS(SELECT 1 FROM public.profiles WHERE id = final_uuid) THEN
            INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
            VALUES (final_uuid, expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET user_id = EXCLUDED.user_id, last_used_at = now();
        ELSE
            INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
            VALUES (expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
        VALUES (expo_token, p_device_type, now(), true)
        ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
    END;

    -- B. Dedicated Admin Token Updates
    -- If identity matches an admin account, upsert into admin_push_tokens
    IF EXISTS (
        SELECT 1 FROM public.admin_accounts 
        WHERE (id::text = final_id OR username = final_id OR username ILIKE final_id)
    ) THEN
        found_admin := true;
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (final_id, expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE 
            SET admin_id = EXCLUDED.admin_id, 
                updated_at = now();
        
        -- Legacy update for admin_accounts fcm_admin column
        UPDATE public.admin_accounts 
        SET fcm_admin = expo_token
        WHERE (id::text = final_id OR username = final_id OR username ILIKE final_id);
    END IF;

    -- C. Update Hospital Accounts
    UPDATE public.hospital_accounts
    SET fcm_hospital = expo_token
    WHERE (id::text = final_id OR email = final_id OR email ILIKE final_id)
    RETURNING true INTO found_hosp;

    -- D. Log debug info
    INSERT INTO public.fcm_debug_logs (received_id, matched_admin, matched_hosp)
    VALUES (final_id, found_admin, found_hosp);
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text) TO anon, authenticated, service_role;
