import 'dotenv/config';
const token = process.env.SUPABASE_ACCESS_TOKEN;
async function q(sql) {
    const r = await fetch('https://api.supabase.com/v1/projects/rlnaylyjxjjaqzwpuhar/database/query', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sql }),
    });
    return { s: r.status, d: await r.json() };
}

// Check public.users NOT NULL columns
const r1 = await q(`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_schema='public' AND table_name='users' AND is_nullable='NO' ORDER BY ordinal_position;`);
console.log('NOT NULL cols in public.users:');
if (Array.isArray(r1.d)) r1.d.forEach(c => console.log(`  ${c.column_name} default=${c.column_default || 'NONE'}`));

// Check foreign keys referencing auth.users
const r2 = await q(`SELECT tc.table_name, kcu.column_name, ccu.table_schema, ccu.table_name as ref_table FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name=kcu.constraint_name JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name=ccu.constraint_name WHERE tc.constraint_type='FOREIGN KEY' AND ccu.table_name='users' LIMIT 20;`);
console.log('\nFK refs to users:');
if (Array.isArray(r2.d)) r2.d.forEach(c => console.log(`  ${c.table_name}.${c.column_name} -> ${c.ref_table}`));

// Check triggers on public.users
const r3 = await q(`SELECT tgname, tgfoid::regproc FROM pg_trigger WHERE tgrelid='public.users'::regclass AND NOT tgisinternal;`);
console.log('\nTriggers on public.users:');
if (Array.isArray(r3.d)) r3.d.forEach(t => console.log(`  ${t.tgname}: ${t.tgfoid}`));
else console.log(JSON.stringify(r3.d));
