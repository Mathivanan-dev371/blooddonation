const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function debugTokens() {
    console.log('Checking FCM tokens...');
    const { data, error } = await supabase
        .from('fcm_tokens')
        .select('fcm_token, user_id, is_active');
    
    if (error) {
        console.error('Error fetching tokens:', error);
        return;
    }

    console.log(`Found ${data.length} tokens in fcm_tokens table.`);
    data.forEach((t, i) => {
        console.log(`Token ${i+1}: ${t.fcm_token.substring(0, 20)}... (User: ${t.user_id}, Active: ${t.is_active})`);
    });

    console.log('\nChecking donors...');
    const { data: donors, error: donorError } = await supabase
        .from('profiles')
        .select('id, role, is_available, student_details(blood_group)')
        .eq('role', 'STUDENT');

    if (donorError) {
        console.error('Error fetching donors:', donorError);
        return;
    }

    console.log(`Found ${donors.length} students.`);
    donors.forEach(d => {
        console.log(`Student ${d.id}: Available=${d.is_available}, Blood=${d.student_details?.blood_group}`);
    });
}

debugTokens();
