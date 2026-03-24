-- ============================================================
-- ADD EXPO TOKEN COLUMN TO ADMIN ACCOUNTS
-- ============================================================

-- 1. Add the column to admin_accounts
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS expo_token text;

-- 2. Update save_fcm_token to populate the new column
-- We drop first because Postgres doesn't allow changing parameter names via "OR REPLACE"
DROP FUNCTION IF EXISTS public.save_fcm_token(text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text);

CREATE OR REPLACE FUNCTION public.save_fcm_token(
    p_expo_token text,
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
    final_hosp_uuid uuid; 
    final_admin_id text;
BEGIN
    final_id := COALESCE(p_user_id, auth.uid()::text);
    IF final_id IS NULL OR final_id = '' THEN RETURN; END IF;

    -- A. Standard upsert to global fcm_tokens table
    BEGIN
        final_uuid := final_id::uuid;
        IF EXISTS(SELECT 1 FROM public.profiles WHERE id = final_uuid) THEN
            INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
            VALUES (final_uuid, p_expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET user_id = EXCLUDED.user_id, last_used_at = now();
        ELSE
            INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
            VALUES (p_expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
        END IF;
    EXCEPTION WHEN OTHERS THEN 
        INSERT INTO public.fcm_tokens (fcm_token, device_type, last_used_at, is_active)
        VALUES (p_expo_token, p_device_type, now(), true)
        ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
    END;

    -- B. Dedicated Admin Token Updates
    SELECT id::text INTO final_admin_id FROM public.admin_accounts 
    WHERE (id::text = final_id OR username = final_id OR username ILIKE final_id)
    LIMIT 1;

    IF final_admin_id IS NOT NULL THEN
        found_admin := true;
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (final_admin_id, p_expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE 
            SET admin_id = EXCLUDED.admin_id, 
                updated_at = now();
        
        -- Update both columns for compatibility
        UPDATE public.admin_accounts 
        SET fcm_admin = p_expo_token,
            expo_token = p_expo_token
        WHERE id::text = final_admin_id;
    END IF;

    -- C. Dedicated Hospital Token Updates
    SELECT id INTO final_hosp_uuid FROM public.hospital_accounts
    WHERE (id::text = final_id OR email = final_id OR email ILIKE final_id)
    LIMIT 1;

    IF final_hosp_uuid IS NOT NULL THEN
        found_hosp := true;
        INSERT INTO public.hospital_push_tokens (hospital_id, fcm_token, updated_at)
        VALUES (final_hosp_uuid, p_expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE 
            SET hospital_id = EXCLUDED.hospital_id, 
                updated_at = now();

        UPDATE public.hospital_accounts
        SET fcm_hospital = p_expo_token
        WHERE id = final_hosp_uuid;
    END IF;

    -- D. Log debug info
    INSERT INTO public.fcm_debug_logs (received_id, matched_admin, matched_hosp)
    VALUES (final_id, found_admin, found_hosp);
END;
$$;
