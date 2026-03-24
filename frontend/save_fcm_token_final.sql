-- ============================================================
-- FINAL SAVE_FCM_TOKEN MASTER FUNCTION (OPTIMIZED ADMIN/HOSPITAL)
-- Ensures tokens are stored based on the user's login type
-- ============================================================

-- 1. Drop existing to handle parameter changes
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text);
DROP FUNCTION IF EXISTS public.save_fcm_token(text, text, text, text);

-- 2. Create the robust Save Function
CREATE OR REPLACE FUNCTION public.save_fcm_token(
    p_expo_token text,
    p_user_id text,
    p_role text DEFAULT 'STUDENT', -- 'HOSPITAL', 'ADMIN', or 'STUDENT'
    p_device_type text DEFAULT 'mobile'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    found_uuid uuid;
    resolved_admin_id text;
BEGIN
    -- 🚨 SAFETY: Return if no token or ID provided
    IF p_expo_token IS NULL OR p_expo_token = '' OR p_user_id IS NULL OR p_user_id = '' THEN RETURN; END IF;

    -- 🌟 ROLE-BASED ROUTING Logic

    -- A. HOSPITAL ROLE 🏥
    IF UPPER(p_role) = 'HOSPITAL' THEN
        -- Resolve the UUID from hospital_accounts
        SELECT id INTO found_uuid FROM public.hospital_accounts
        WHERE (id::text = p_user_id OR email = p_user_id OR email ILIKE p_user_id)
        LIMIT 1;

        IF found_uuid IS NOT NULL THEN
            -- Update the main hospital table
            UPDATE public.hospital_accounts SET fcm_hospital = p_expo_token WHERE id = found_uuid;
            
            -- Store in the multi-device token table
            INSERT INTO public.hospital_push_tokens (hospital_id, fcm_token, updated_at)
            VALUES (found_uuid, p_expo_token, now())
            ON CONFLICT (fcm_token) DO UPDATE SET hospital_id = EXCLUDED.hospital_id, updated_at = now();
            
            INSERT INTO public.fcm_debug_logs (received_id, matched_hosp) VALUES (p_user_id, true);
        END IF;

    -- B. ADMIN ROLE 👤
    ELSIF UPPER(p_role) = 'ADMIN' THEN
        -- Resolve the Admin account ID
        SELECT id::text INTO resolved_admin_id FROM public.admin_accounts 
        WHERE (id::text = p_user_id OR username = p_user_id)
        LIMIT 1;

        IF resolved_admin_id IS NOT NULL THEN
            -- Update the main admin table (Both legacy and new columns)
            UPDATE public.admin_accounts 
            SET fcm_admin = p_expo_token, 
                expo_token = p_expo_token 
            WHERE id::text = resolved_admin_id;

            -- Store in the specialized push tokens table for admins
            INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
            VALUES (resolved_admin_id, p_expo_token, now())
            ON CONFLICT (fcm_token) DO UPDATE SET updated_at = now();
            
            INSERT INTO public.fcm_debug_logs (received_id, matched_admin) VALUES (p_user_id, true);
        END IF;

    -- C. STUDENT ROLE 🎓
    ELSE
        -- Default to students table (profiles)
        IF p_user_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
            found_uuid := p_user_id::uuid;
            IF EXISTS(SELECT 1 FROM public.profiles WHERE id = found_uuid) THEN
                INSERT INTO public.fcm_tokens (user_id, fcm_token, device_type, last_used_at, is_active)
                VALUES (found_uuid, p_expo_token, p_device_type, now(), true)
                ON CONFLICT (fcm_token) DO UPDATE SET last_used_at = now();
            END IF;
        END IF;
    END IF;

END;
$$;

-- 3. GRANT PERMISSION
GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text, text) TO anon, authenticated, postgres;
