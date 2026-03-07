
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugDonations() {
    console.log('--- DEBUG START ---');

    // 1. Check Profiles
    const { data: profile, error: pErr } = await supabase.from('profiles').select('*').limit(5);
    console.log('Sample Profiles:', profile?.map(p => ({ id: p.id, email: p.email })));

    // 2. Check Donation Attempts
    const { data: donations, error: dErr } = await supabase.from('donation_attempts').select('*');
    console.log('All Donations count:', donations?.length || 0);
    if (donations) {
        donations.forEach(d => console.log(`User: ${d.user_id}, Status: ${d.status}, Date: ${d.date}`));
    }

    // 3. Check Responses
    const { data: responses, error: rErr } = await supabase.from('hospital_response_tracking').select('*');
    console.log('Response Tracking count:', responses?.length || 0);
    if (responses) {
        responses.forEach(r => console.log(`Req: ${r.request_id}, Student: ${r.student_id}, Arrival: ${r.arrival_status}`));
    }

    console.log('--- DEBUG END ---');
}

debugDonations();
