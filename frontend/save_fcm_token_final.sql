-- ============================================================
-- FINAL SAVE_FCM_TOKEN MASTER FUNCTION (SCHEMA & ROLE VERSION)
-- Ensures columns exist and tokens are stored by type
-- ============================================================

-- 1. Ensure Columns Exist (FIXES THE "COLUMN DOES NOT EXIST" ERROR)
ALTER TABLE public.hospital_accounts ADD COLUMN IF NOT EXISTS fcm_hospital text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS fcm_admin text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS expo_token text;

-- 2. Ensure Tables Exist
CREATE TABLE IF NOT EXISTS public.hospital_push_tokens (
    hospital_id uuid NOT NULL, 
    fcm_token text NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.admin_push_tokens (
    admin_id text NOT NULL, 
    fcm_token text NOT NULL PRIMARY KEY,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 3. Drop ALL older versions to handle changes
DROP FUNCTION IF EXISTS public.save_fcm_token(text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text, text);

-- 4. Create the final robust version
CREATE OR REPLACE FUNCTION public.save_fcm_token(
    p_expo_token text,
    p_user_id text,
    p_role text DEFAULT 'STUDENT', 
    p_device_type text DEFAULT 'mobile'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_uuid uuid;
BEGIN
    IF p_expo_token IS NULL OR p_expo_token = '' OR p_user_id IS NULL OR p_user_id = '' THEN RETURN; END IF;

    -- ROUTE 1: HOSPITAL 🏥
    IF UPPER(p_role) = 'HOSPITAL' THEN
        SELECT id INTO found_uuid FROM public.hospital_accounts 
        WHERE (id::text = p_user_id OR email = p_user_id OR email ILIKE p_user_id) 
        LIMIT 1;

        IF found_uuid IS NOT NULL THEN
            UPDATE public.hospital_accounts SET fcm_hospital = p_expo_token WHERE id = found_uuid;
            INSERT INTO public.hospital_push_tokens (hospital_id, fcm_token, updated_at)
            VALUES (found_uuid, p_expo_token, now())
            ON CONFLICT (fcm_token) DO UPDATE SET updated_at = now();
            RETURN;
        END IF;
    END IF;

    -- ROUTE 2: ADMIN 👤
    IF UPPER(p_role) = 'ADMIN' THEN
        UPDATE public.admin_accounts 
        SET fcm_admin = p_expo_token, expo_token = p_expo_token 
        WHERE (id::text = p_user_id OR username = p_user_id);
        
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (p_user_id, p_expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE SET updated_at = now();
        RETURN;
    END IF;

    -- ROUTE 3: STUDENT 🎓
    IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
        VALUES (p_user_id::uuid, p_expo_token, p_device_type, now(), true)
        ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
    END IF;

END;
$$;

-- 5. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text, text) TO anon, authenticated, service_role, postgres;
