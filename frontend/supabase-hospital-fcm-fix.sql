-- ============================================================
-- HOSPITAL PUSH TOKENS FIX: Store multiple tokens per hospital
-- Updated: hospital_id acts as primary key (composite)
-- Fixed: Foreign key syntax error by matching types (UUID)
-- ============================================================

-- Drop and recreate to ensure clean type change
DROP TABLE IF EXISTS public.hospital_push_tokens;

-- 1. Create Dedicated Hospital Push Token Table
-- We use a composite PRIMARY KEY of (hospital_id, fcm_token) 
-- hospital_id is set to UUID to match hospital_accounts(id) type for the FK.
CREATE TABLE public.hospital_push_tokens (
    hospital_id uuid NOT NULL, 
    fcm_token text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (hospital_id, fcm_token),
    UNIQUE (fcm_token)
);

-- 2. Apply Foreign Key Constraint (Now without the invalid cast)
-- This works because hospital_id is now natively a uuid.
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'hospital_accounts') THEN
        ALTER TABLE public.hospital_push_tokens 
        ADD CONSTRAINT fk_hospital_accounts 
        FOREIGN KEY (hospital_id) REFERENCES public.hospital_accounts(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Update save_fcm_token 
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
    final_hosp_uuid uuid; -- Changed to uuid
    final_admin_id text;
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
    SELECT id::text INTO final_admin_id FROM public.admin_accounts 
    WHERE (id::text = final_id OR username = final_id OR username ILIKE final_id)
    LIMIT 1;

    IF final_admin_id IS NOT NULL THEN
        found_admin := true;
        INSERT INTO public.admin_push_tokens (admin_id, fcm_token, updated_at)
        VALUES (final_admin_id, expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE 
            SET admin_id = EXCLUDED.admin_id, 
                updated_at = now();
        
        UPDATE public.admin_accounts 
        SET fcm_admin = expo_token
        WHERE id::text = final_admin_id;
    END IF;

    -- C. Dedicated Hospital Token Updates
    -- Resolve Hospital UUID
    SELECT id INTO final_hosp_uuid FROM public.hospital_accounts
    WHERE (id::text = final_id OR email = final_id OR email ILIKE final_id)
    LIMIT 1;

    IF final_hosp_uuid IS NOT NULL THEN
        found_hosp := true;
        -- Upsert into dedicated table
        INSERT INTO public.hospital_push_tokens (hospital_id, fcm_token, updated_at)
        VALUES (final_hosp_uuid, expo_token, now())
        ON CONFLICT (fcm_token) DO UPDATE 
            SET hospital_id = EXCLUDED.hospital_id, 
                updated_at = now();

        UPDATE public.hospital_accounts
        SET fcm_hospital = expo_token
        WHERE id = final_hosp_uuid;
    END IF;

    -- D. Log debug info
    INSERT INTO public.fcm_debug_logs (received_id, matched_admin, matched_hosp)
    VALUES (final_id, found_admin, found_hosp);
END;
$$;

-- 4. Update get_tokens_for_notification
CREATE OR REPLACE FUNCTION public.get_tokens_for_notification(
    p_user_ids text[] DEFAULT NULL
)
RETURNS TABLE(fcm_token text, user_id text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF p_user_ids IS NULL THEN
        RETURN QUERY 
            SELECT ft.fcm_token, ft.user_id::text FROM public.fcm_tokens ft WHERE ft.is_active = true
            UNION
            SELECT aa.fcm_admin, aa.id::text FROM public.admin_accounts aa WHERE aa.fcm_admin IS NOT NULL
            UNION
            SELECT apt.fcm_token, apt.admin_id FROM public.admin_push_tokens apt
            UNION
            SELECT hpt.fcm_token, hpt.hospital_id::text FROM public.hospital_push_tokens hpt;
    ELSE
        RETURN QUERY 
            SELECT ft.fcm_token, ft.user_id::text FROM public.fcm_tokens ft 
            WHERE (ft.user_id::text = ANY(p_user_ids) OR ft.id::text = ANY(p_user_ids)) 
              AND ft.is_active = true
            UNION
            SELECT aa.fcm_admin, aa.id::text FROM public.admin_accounts aa 
            WHERE (aa.id::text = ANY(p_user_ids) OR aa.username = ANY(p_user_ids))
              AND aa.fcm_admin IS NOT NULL
            UNION
            SELECT apt.fcm_token, apt.admin_id FROM public.admin_push_tokens apt
            WHERE (apt.admin_id = ANY(p_user_ids))
            UNION
            SELECT hpt.fcm_token, hpt.hospital_id::text FROM public.hospital_push_tokens hpt
            WHERE (hpt.hospital_id::text = ANY(p_user_ids));
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_fcm_token(text, text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_tokens_for_notification(text[]) TO anon, authenticated, service_role;
