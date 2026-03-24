-- ============================================================
-- FINAL FCM MASTER SCRIPT (WITH FULL CASCADE & ADMIN TARGETING)
-- ============================================================

-- 1. DROP ALL OLD VERSIONS (Using CASCADE to be 100% sure we remove ambiguity)
DROP FUNCTION IF EXISTS public.save_fcm_token CASCADE;
DROP FUNCTION IF EXISTS public.get_tokens_for_notification CASCADE;

-- 2. CREATE MASTER SAVE FUNCTION (ROLE-AWARE)
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

    -- ADMIN 👤 (Stores in dedicated table and account)
    IF UPPER(p_role) = 'ADMIN' THEN
        UPDATE public.admin_accounts SET fcm_admin = p_expo_token, expo_token = p_expo_token WHERE (id::text = p_user_id OR username = p_user_id);
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (p_user_id, p_expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE SET updated_at = now();
        RETURN;
    END IF;

    -- STUDENT 🎓 (Profile matches)
    IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        found_uuid := p_user_id::uuid;
        IF EXISTS(SELECT 1 FROM public.profiles WHERE id = found_uuid) THEN
            INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
            VALUES (found_uuid, p_expo_token, p_device_type, now(), true)
            ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
        END IF;
    END IF;
END;
$$;

-- 3. MASTER FETCH FUNCTION (ROLE-AWARE BROADCAST)
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
            SELECT ft.fcm_token, ft.user_id::text as u_id, 'STUDENT' as r FROM public.fcm_tokens ft WHERE ft.is_active = true
            UNION
            -- Admin pool
            SELECT apt.fcm_token, apt.admin_id as u_id, 'ADMIN' as r FROM public.admin_push_tokens apt
            UNION
            -- Hospital pool
            SELECT hpt.fcm_token, hpt.hospital_id::text as u_id, 'HOSPITAL' as r FROM public.hospital_push_tokens hpt
        )
        SELECT DISTINCT ON (t.fcm_token) t.fcm_token, t.u_id
        FROM all_tokens t
        WHERE 
            (p_user_ids IS NULL OR t.u_id = ANY(p_user_ids))
            AND (p_role IS NULL OR UPPER(t.r) = UPPER(p_role));
END;
$$;

-- 4. GRANT PERMISSIONS
GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text, text) TO anon, authenticated, service_role, postgres;
GRANT EXECUTE ON FUNCTION public.get_tokens_for_notification(text[], text) TO anon, authenticated, service_role, postgres;
