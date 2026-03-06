
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDonors() {
    console.log('Checking donors in database...');

    const { data: profiles, error: profError } = await supabase
        .from('profiles')
        .select('*, student_details(*)');

    if (profError) {
        console.error('Error fetching profiles:', profError);
        return;
    }

    console.log('Total profiles found:', profiles.length);
    profiles.forEach(p => {
        console.log(`User: ${p.id}, Role: ${p.role}, Available: ${p.is_available}, Blood: ${p.student_details?.blood_group}`);
    });

    const { data: tokens, error: tokenError } = await supabase
        .from('fcm_tokens')
        .select('*');

    if (tokenError) {
        console.error('Error fetching tokens:', tokenError);
    } else {
        console.log('Total FCM tokens found:', tokens.length);
        tokens.forEach(t => {
            console.log(`Token for User: ${t.user_id}, Active: ${t.is_active}`);
        });
    }
}

checkDonors();
