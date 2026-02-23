import pg from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

console.log('🚀 Running custom fields migrations...\n');

const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    try {
        await client.connect();
        const migrationPath = join(__dirname, '../supabase/migrations/20260223000001_add_all_custom_fields.sql');
        const sql = readFileSync(migrationPath, 'utf-8');
        await client.query(sql);
        console.log('✅ Migrations executed successfully!\n');
    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigrations();
