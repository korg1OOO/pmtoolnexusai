/**
 * Apply the AI credits model overhaul migration.
 * Adds monthly_credits_granted_at, updates pricing tiers, backfills users.
 * 
 * Usage: node scripts/apply-credits-overhaul.mjs
 */
import 'dotenv/config';
import pg from 'pg';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL in .env file');
    process.exit(1);
}

const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

try {
    console.log('🔌 Connecting to database...');
    await client.connect();

    const sqlPath = resolve(__dirname, '../supabase/migrations/20260314100000_credits_model_overhaul.sql');
    const sql = readFileSync(sqlPath, 'utf8');

    console.log('📋 Applying credits model overhaul migration...');
    await client.query(sql);
    console.log('✅ Migration applied successfully!');

    // Verify
    const { rows: tiers } = await client.query('SELECT tier_name, credits, price FROM public.ai_credit_pricing ORDER BY display_order');
    console.log('\n📊 New pricing tiers:');
    for (const t of tiers) {
        console.log(`   ${t.tier_name}: ${Number(t.credits).toLocaleString()} credits / $${t.price}`);
    }
} catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
} finally {
    await client.end();
}
