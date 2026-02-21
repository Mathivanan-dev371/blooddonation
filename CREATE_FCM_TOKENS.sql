-- Create FCM Tokens table linked to student_details
-- Added UNIQUE constraint to user_id to support easy upserts on reinstall
CREATE TABLE IF NOT EXISTS public.fcm_tokens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.student_details(user_id) ON DELETE CASCADE UNIQUE,
    fcm_token TEXT NOT NULL,
    device_type TEXT, -- e.g., 'android', 'ios', 'web'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON public.fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_token ON public.fcm_tokens(fcm_token);

-- Enable Row Level Security
ALTER TABLE public.fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own tokens
DROP POLICY IF EXISTS "Users can insert their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can insert their own fcm tokens"
ON public.fcm_tokens FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

-- Policy: Users can view their own tokens
DROP POLICY IF EXISTS "Users can view their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can view their own fcm tokens"
ON public.fcm_tokens FOR SELECT
USING (
    user_id = auth.uid()
);

-- Policy: Users can update their own tokens
DROP POLICY IF EXISTS "Users can update their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can update their own fcm tokens"
ON public.fcm_tokens FOR UPDATE
USING (
    user_id = auth.uid()
);

-- Policy: Users can delete their own tokens
DROP POLICY IF EXISTS "Users can delete their own fcm tokens" ON public.fcm_tokens;
CREATE POLICY "Users can delete their own fcm tokens"
ON public.fcm_tokens FOR DELETE
USING (
    user_id = auth.uid()
);

-- Function to update 'updated_at' automatically
CREATE OR REPLACE FUNCTION update_fcm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamp
DROP TRIGGER IF EXISTS trigger_update_fcm_updated_at ON public.fcm_tokens;
CREATE TRIGGER trigger_update_fcm_updated_at
BEFORE UPDATE ON public.fcm_tokens
FOR EACH ROW
EXECUTE FUNCTION update_fcm_updated_at();

SELECT 'FCM Tokens table created successfully' as status;
