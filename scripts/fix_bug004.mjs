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

// Check current columns
const r0 = await q(`SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='project_evm_snapshots' ORDER BY ordinal_position;`);
console.log('Current cols:', r0.d);

// Add snapshot_date column if missing
const r1 = await q(`ALTER TABLE public.project_evm_snapshots ADD COLUMN IF NOT EXISTS snapshot_date TIMESTAMPTZ DEFAULT NOW();`);
console.log('Add snapshot_date:', r1.s, r1.d);

// Backfill from created_at if exists
const r2 = await q(`UPDATE public.project_evm_snapshots SET snapshot_date = COALESCE(created_at, NOW()) WHERE snapshot_date IS NULL;`);
console.log('Backfill:', r2.s, r2.d);
