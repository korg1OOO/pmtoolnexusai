import 'dotenv/config';

const token = process.env.SUPABASE_ACCESS_TOKEN;

// Query profiles table columns
const sql = `SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;`;

const res = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql }),
});

console.log('Status:', res.status);
const data = await res.json();
console.log('Profiles columns:');
data.forEach(row => console.log(`  ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'nullable'} ${row.column_default || ''}`));

// Also check what the trigger function looks like
const sql2 = `SELECT prosrc FROM pg_proc WHERE proname = 'handle_new_user';`;
const res2 = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: sql2 }),
});

const triggers = await res2.json();
console.log('\nCurrent trigger source:');
triggers.forEach(t => console.log(t.prosrc));
