-- ============================================================
-- FINAL FCM MASTER SCRIPT (MULTI-ROLL FETCH CAPABILITY)
-- ============================================================

-- 1. DROP ALL OLD VERSIONS
DROP FUNCTION IF EXISTS public.save_fcm_token(text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, uuid, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text, text);

DROP FUNCTION IF EXISTS public.get_tokens_for_notification();
DROP FUNCTION IF EXISTS public.get_tokens_for_notification(text[]);
DROP FUNCTION IF EXISTS public.get_tokens_for_notification(text[], text);

-- 2. MASTER SAVE FUNCTION
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

    -- HOSPITAL 🏥
    IF UPPER(p_role) = 'HOSPITAL' THEN
        SELECT id INTO found_uuid FROM public.hospital_accounts WHERE (id::text = p_user_id OR email = p_user_id) LIMIT 1;
        IF found_uuid IS NOT NULL THEN
            UPDATE public.hospital_accounts SET fcm_hospital = p_expo_token WHERE id = found_uuid;
            INSERT INTO public.hospital_push_tokens (hospital_id, fcm_token, updated_at)
            VALUES (found_uuid, p_expo_token, now())
            ON CONFLICT (fcm_token) DO UPDATE SET hospital_id = EXCLUDED.hospital_id, updated_at = now();
            RETURN;
        END IF;
    END IF;

    -- ADMIN 👤
    IF UPPER(p_role) = 'ADMIN' THEN
        UPDATE public.admin_accounts SET fcm_admin = p_expo_token, expo_token = p_expo_token WHERE (id::text = p_user_id OR username = p_user_id);
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (p_user_id, p_expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE SET updated_at = now();
        RETURN;
    END IF;

    -- STUDENT 🎓
    IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        found_uuid := p_user_id::uuid;
        IF EXISTS(SELECT 1 FROM public.profiles WHERE id = found_uuid) THEN
            INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
            VALUES (found_uuid, p_expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET user_id = EXCLUDED.user_id, last_used_at = now();
        END IF;
    END IF;
END;
$$;

-- 3. MASTER FETCH FUNCTION (ROLE-AWARE)
-- Collects tokens based on the requested role pool
CREATE OR REPLACE FUNCTION public.get_tokens_for_notification(
    p_user_ids text[] DEFAULT NULL,
    p_role text DEFAULT NULL
)
RETURNS TABLE(fcm_token text, user_id text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY 
        WITH all_tokens AS (
            -- Student pool
            SELECT ft.fcm_token, ft.user_id::text, 'STUDENT' as role FROM public.fcm_tokens ft WHERE ft.is_active = true
            UNION
            -- Admin pool
            SELECT apt.fcm_token, apt.admin_id, 'ADMIN' as role FROM public.admin_push_tokens apt
            UNION
            -- Hospital pool
            SELECT hpt.fcm_token, hpt.hospital_id::text, 'HOSPITAL' as role FROM public.hospital_push_tokens hpt
        )
        SELECT DISTINCT ON (t.fcm_token) t.fcm_token, t.user_id
        FROM all_tokens t
        WHERE 
            (p_user_ids IS NULL OR t.user_id = ANY(p_user_ids))
            AND (p_role IS NULL OR UPPER(t.role) = UPPER(p_role));
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text, text) TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_tokens_for_notification(text[], text) TO anon, authenticated, service_role, postgres;
