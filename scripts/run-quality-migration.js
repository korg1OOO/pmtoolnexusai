import pg from 'pg';
import fs from 'fs';

const { Client } = pg;

async function runMigration() {
    const connectionString = 'postgresql://postgres.rlnaylyjxjjaqzwpuhar:9kfAknS8q9tCJzo2@aws-1-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true';
    const client = new Client({ connectionString });

    try {
        await client.connect();
        console.log('Connected to DB. Running migration...');
        const sql = fs.readFileSync('supabase/migrations/20260223150000_create_quality_register.sql', 'utf-8');
        await client.query(sql);
        console.log('Migration ran successfully!');
    } catch (err) {
        console.error('Error running migration', err);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
