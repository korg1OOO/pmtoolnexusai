import 'dotenv/config';
const token = process.env.SUPABASE_ACCESS_TOKEN;
async function q(sql) {
    const r = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
    });
    return { s: r.status, d: await r.text() };
}

// Test: Simulate what handle_new_user does — insert into both profiles AND users
const testId = '00000000-0000-0000-0000-000000test02';

// 1. Insert into profiles
const r1 = await q(`INSERT INTO public.profiles (id, email, full_name, avatar_url)
VALUES ('${testId}', 'trigger_test@example.com', 'Trigger Test', null)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = NOW()
RETURNING id, email;`);
console.log('Profiles insert:', r1.s, r1.d);

// 2. Insert into users
const r2 = await q(`INSERT INTO public.users (id, email, full_name, avatar_url, role)
VALUES ('${testId}', 'trigger_test@example.com', 'Trigger Test', null, 'user')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name
RETURNING id, email;`);
console.log('Users insert:', r2.s, r2.d);

// 3. Verify both exist
const r3 = await q(`SELECT 'profiles' as tbl, id, email FROM public.profiles WHERE id = '${testId}'
UNION ALL
SELECT 'users' as tbl, id, email FROM public.users WHERE id = '${testId}';`);
console.log('Verify:', r3.s, r3.d);

// 4. Clean up test data
const r4 = await q(`DELETE FROM public.profiles WHERE id = '${testId}'; DELETE FROM public.users WHERE id = '${testId}';`);
console.log('Cleanup:', r4.s);

// 5. Verify the trigger function source
const r5 = await q(`SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`);
console.log('\nTrigger source includes users insert:', r5.d.includes('public.users'));
