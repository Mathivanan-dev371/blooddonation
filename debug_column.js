const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './frontend/.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkColumns() {
    // Try to update notification_sent to see if it exists
    const { error } = await supabase
        .from('hospital_requests')
        .update({ notification_sent: false })
        .eq('id', '00000000-0000-0000-0000-000000000000'); 
    
    if (error) {
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
    } else {
        console.log('Column notification_sent exists and is accessible.');
    }
}
checkColumns();
