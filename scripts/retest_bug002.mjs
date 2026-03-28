/**
 * Retest BUG-002: Signup flow
 * Tests if the rate limit has cooled down after ~3 hours
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://iqypmwcsxawpltsnqbwt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeXBtd2NzeGF3cGx0c25xYnd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MTM2MjQsImV4cCI6MjA4NzA4OTYyNH0.9MzghllOW7IfZm4ZLfkl8kvPk3mFmiMYDkybf6gHR4I';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxeXBtd2NzeGF3cGx0c25xYnd0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTUxMzYyNCwiZXhwIjoyMDg3MDg5NjI0fQ.1I6fOGJWGajVDlOjXFHSqw4dJcQ14hBIZgXYWCVcVbg';

const supabase = createClient(supabaseUrl, supabaseKey);
const admin = createClient(supabaseUrl, serviceKey);

async function run() {
    const testEmail = `bug002_test_${Date.now()}@example.com`;
    const testPass = 'TestPassword123!';

    console.log('=== BUG-002 Retest: Signup Flow ===');
    console.log(`Test email: ${testEmail}\n`);

    // Step 1: Try signup
    console.log('1. Attempting signup via auth.signUp()...');
    const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPass,
        options: { data: { full_name: 'BUG-002 Test User' } }
    });

    if (error) {
        console.log(`   ❌ Signup failed: ${error.message} (${error.status})`);
        if (error.status === 429) {
            console.log('   Still rate-limited. Need to wait longer.');
        }
        return;
    }

    const userId = data?.user?.id;
    console.log(`   ✅ Signup succeeded! User ID: ${userId}`);

    // Step 2: Check profiles table
    console.log('\n2. Checking profiles table...');
    const { data: profile, error: profileErr } = await admin
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', userId)
        .single();

    if (profileErr) {
        console.log(`   ❌ Profile NOT created: ${profileErr.message}`);
    } else {
        console.log(`   ✅ Profile created: ${JSON.stringify(profile)}`);
    }

    // Step 3: Check users table
    console.log('\n3. Checking users table...');
    const { data: userRow, error: userErr } = await admin
        .from('users')
        .select('id, email, role')
        .eq('id', userId)
        .single();

    if (userErr) {
        console.log(`   ❌ Users row NOT created: ${userErr.message}`);
    } else {
        console.log(`   ✅ Users row created: ${JSON.stringify(userRow)}`);
    }

    // Step 4: Cleanup - delete test user
    console.log('\n4. Cleaning up test user...');
    const { error: deleteErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteErr) {
        console.log(`   ⚠️ Cleanup failed: ${deleteErr.message}`);
    } else {
        console.log('   ✅ Test user cleaned up');
    }

    console.log('\n=== BUG-002 Result ===');
    if (!profileErr && !userErr) {
        console.log('✅ BUG-002 FIXED: Signup creates profiles + users rows');
    } else if (!profileErr) {
        console.log('⚠️ PARTIAL: Profile created but users row missing');
    } else {
        console.log('❌ STILL BROKEN: Neither profile nor users row created');
    }
}

run().catch(console.error);
