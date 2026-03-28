import pg from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:6543/postgres';

const sql = fs.readFileSync(path.join(import.meta.dirname, '..', 'supabase', 'migrations', '20260314000000_project_automations.sql'), 'utf8');

async function run() {
    console.log('=== Applying project_automation_rules migration ===\n');

    const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

    try {
        await client.connect();
        console.log('Connected to database.');

        await client.query(sql);
        console.log('✅ Migration applied successfully!');

        // Verify
        const result = await client.query('SELECT count(*) FROM project_automation_rules');
        console.log(`✅ Table verified: ${result.rows[0].count} rows`);
    } catch (err) {
        console.error('Migration error:', err.message);
    } finally {
        await client.end();
    }
}

run();
