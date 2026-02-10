import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '❌ Missing Supabase credentials!\n\n' +
    'Please configure your .env file:\n' +
    '1. Copy .env.example to .env\n' +
    '2. Add your Supabase URL and anon key\n' +
    '3. Restart the dev server\n\n' +
    'See ENV_SETUP_GUIDE.md for detailed instructions.'
  );
}

if (supabaseUrl.includes('your-project-id') || supabaseAnonKey.includes('your-anon-key')) {
  console.error(
    '⚠️  Supabase credentials not configured!\n' +
    'Please update your .env file with actual values.\n' +
    'See ENV_SETUP_GUIDE.md for instructions.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
