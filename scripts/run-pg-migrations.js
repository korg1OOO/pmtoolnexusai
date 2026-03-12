/**
 * PostgreSQL Migration Runner
 * Executes SQL migrations using direct PostgreSQL connection
 */

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

console.log('🚀 Running database migrations...\n');
console.log('📦 Connecting to PostgreSQL...\n');

const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260214_ml_learning_loop.sql');
        const sql = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Executing 20260214_ml_learning_loop.sql...\n');

        // Execute the entire SQL file
        await client.query(sql);

        console.log('✅ Migrations executed successfully!\n');

        // Verify tables
        const result = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN (
                'ml_predictions',
                'ml_learning_patterns',
                'ml_user_preferences',
                'ml_experiments',
                'ml_model_metrics'
            )
            ORDER BY table_name;
        `);

        console.log('🔍 Verification:');
        if (result.rows.length > 0) {
            result.rows.forEach(row => {
                console.log(`   ✅ ${row.table_name}`);
            });
        } else {
            console.log('   ⚠️  No tables found (they may already exist)');
        }

        console.log('\n🎉 ML Learning Loop migration complete!');

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error.message);

        if (error.message.includes('already exists')) {
            console.log('\n✅ Tables already exist - this is OK!');
        } else {
            process.exit(1);
        }
    } finally {
        await client.end();
    }
}

runMigrations();
