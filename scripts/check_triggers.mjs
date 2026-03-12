import 'dotenv/config';

const token = process.env.SUPABASE_ACCESS_TOKEN;

// List ALL triggers on auth.users
const sql = `SELECT trigger_name, event_manipulation, action_statement 
FROM information_schema.triggers 
WHERE event_object_schema = 'auth' AND event_object_table = 'users'
ORDER BY trigger_name;`;

const res = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
});

const data = await res.json();
console.log('Triggers on auth.users:');
data.forEach(t => console.log(`  ${t.trigger_name}: ${t.event_manipulation} -> ${t.action_statement}`));

// Also check for any NOT NULL constraints or required fields we're missing in profiles
const sql2 = `SELECT column_name, is_nullable, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles' AND is_nullable = 'NO'
ORDER BY ordinal_position;`;

const res2 = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql2 }),
});

const required = await res2.json();
console.log('\nNOT NULL columns in profiles:');
required.forEach(c => console.log(`  ${c.column_name} ${c.column_default ? `DEFAULT ${c.column_default}` : 'NO DEFAULT'}`));
