import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
    console.error('No DATABASE_URL found');
    process.exit(1);
}

const client = new Client({
    connectionString: dbUrl,
});

async function run() {
    try {
        await client.connect();
        console.log('Connected to DB');

        await client.query('BEGIN');
        console.log('Dropping existing constraint...');
        await client.query('ALTER TABLE ai_credits DROP CONSTRAINT IF EXISTS unique_user');
        await client.query('ALTER TABLE ai_credits ALTER COLUMN tenant_id DROP NOT NULL');

        console.log('Deleting duplicate records...');
        await client.query(`
      DELETE FROM ai_credits a USING (
        SELECT MIN(ctid) as ctid, user_id FROM ai_credits GROUP BY user_id HAVING COUNT(*) > 1
      ) b
      WHERE a.user_id = b.user_id AND a.ctid <> b.ctid
    `);

        console.log('Adding unique constraint...');
        await client.query('ALTER TABLE ai_credits ADD CONSTRAINT unique_user UNIQUE (user_id)');

        await client.query('COMMIT');
        console.log('Finished fixing constraints!');
    } catch (err) {
        console.error('Error applying constraint fix', err);
        await client.query('ROLLBACK');
    } finally {
        await client.end();
    }
}

run();
