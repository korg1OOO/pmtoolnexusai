const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key (first 30 chars):', supabaseServiceKey?.substring(0, 30) + '...');
console.log('Key length:', supabaseServiceKey?.length);
console.log('\nAttempting connection...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testConnection() {
    try {
        // Test 1: Simple query
        console.log('Test 1: Querying tenants table...');
        const { data, error } = await supabase
            .from('tenants')
            .select('count')
            .limit(1);

        if (error) {
            console.error('❌ Error:', error.message);
            console.error('Hint:', error.hint);
            console.error('\nPossible issues:');
            console.error('1. Service role key is incorrect or expired');
            console.error('2. Service role key was regenerated in Supabase dashboard');
            console.error('3. Copy/paste error (extra spaces, line breaks)');
            console.error('\nTo fix:');
            console.error('1. Go to: https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/settings/api');
            console.error('2. Copy the service_role key again');
            console.error('3. Replace the entire value in .env file');
            return false;
        }

        console.log('✅ Connection successful!');
        console.log('Data:', data);
        return true;

    } catch (error) {
        console.error('❌ Exception:', error.message);
        return false;
    }
}

testConnection();
