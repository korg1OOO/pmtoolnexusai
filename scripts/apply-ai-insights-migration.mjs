/**
 * Apply AI Insights Migration via Direct PostgreSQL Connection
 */

import pg from 'pg';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ Missing DATABASE_URL in .env file');
    process.exit(1);
}

async function applyMigration() {
    const client = new pg.Client({
        connectionString: DATABASE_URL,
    });

    try {
        console.log('🔌 Connecting to database...\n');
        await client.connect();
        console.log('✅ Connected to Supabase database\n');

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260212180000_ai_insights.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file loaded:', migrationPath);
        console.log('📏 Size:', (migrationSQL.length / 1024).toFixed(2), 'KB\n');

        console.log('🚀 Executing migration...\n');

        // Execute the entire migration as a single transaction
        await client.query('BEGIN');

        try {
            await client.query(migrationSQL);
            await client.query('COMMIT');

            console.log('✅ Migration executed successfully!\n');
            console.log('📊 Table created:');
            console.log('   ✓ ai_insights');
            console.log('\n🔐 RLS policies applied');
            console.log('📈 Indexes created');
            console.log('🔄 Triggers configured');
            console.log('📝 Sample insights inserted\n');

            // Verify table exists
            const result = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'ai_insights'
      `);

            console.log('🔍 Verification:');
            result.rows.forEach(row => {
                console.log(`   ✓ ${row.table_name} table exists`);
            });

            console.log('\n✨ Phase 11 AI insights migration complete!');

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nError details:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

// Run migration
applyMigration();
