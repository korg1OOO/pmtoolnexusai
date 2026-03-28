import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const s = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: (url, opts) => fetch(url, { ...opts, signal: AbortSignal.timeout(15000) }) },
});

try {
    // Step 1: list first 5 users
    const { data, error } = await s.auth.admin.listUsers({ perPage: 5 });
    if (error) throw error;
    const emails = data.users.map(u => u.email);
    writeFileSync('scripts/users.txt', emails.join('\n'));
    console.log('EMAILS:', emails.join(', '));

    // Step 2: reset password for first user
    const target = data.users[0];
    const { error: e2 } = await s.auth.admin.updateUserById(target.id, { password: 'TestPassword123!' });
    if (e2) console.log('RESET_FAIL:', e2.message);
    else console.log('RESET_OK:', target.email);
} catch (e) {
    console.log('CAUGHT:', e.message || e);
}
