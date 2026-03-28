import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const email = 'qa-test@kiroxys.com';
const password = 'TestPassword123!';

async function main() {
    // 1. List existing users
    const { data: existingUsers } = await supabase.auth.admin.listUsers({ perPage: 10 });
    console.log('Existing users:', existingUsers?.users?.map(u => u.email));

    // 2. Check if our test user already exists
    const existing = existingUsers?.users?.find(u => u.email === email);
    if (existing) {
        console.log('Test user already exists:', existing.id);
        // Try to reset password
        const { error } = await supabase.auth.admin.updateUserById(existing.id, { password });
        if (error) console.error('Failed to update password:', error.message);
        else console.log('Password updated successfully');

        // Set platform_role to admin
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({ id: existing.id, full_name: 'QA Tester', platform_role: 'admin' }, { onConflict: 'id' });
        if (profileError) console.error('Profile update failed:', profileError.message);
        else console.log('Profile set to admin');
        return;
    }

    // 3. Create user via admin API
    const { data, error } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'QA Tester' },
    });

    if (error) {
        console.error('Failed to create user:', error.message);
        return;
    }

    console.log('Created user:', data.user.id);

    // 4. Set platform_role to admin in profiles
    const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ id: data.user.id, full_name: 'QA Tester', platform_role: 'admin' }, { onConflict: 'id' });

    if (profileError) console.error('Profile upsert failed:', profileError.message);
    else console.log('Profile created with admin role');

    // 5. Create a subscription record
    const { error: subError } = await supabase
        .from('subscriptions')
        .insert({ user_id: data.user.id, email, tier: 'agency', status: 'active', full_name: 'QA Tester' });

    if (subError) console.error('Subscription insert failed:', subError.message);
    else console.log('Subscription created (agency tier)');

    console.log('\n=== Test Credentials ===');
    console.log('Email:', email);
    console.log('Password:', password);
}

main();
