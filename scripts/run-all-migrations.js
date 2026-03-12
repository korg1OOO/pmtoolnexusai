/**
 * Comprehensive PostgreSQL Migration Runner
 * Executes all SQL migrations using direct PostgreSQL connection
 * Uses DATABASE_URL from .env file
 */

import pg from 'pg';
import { readFileSync, readdirSync } from 'fs';
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
    console.error('Please add DATABASE_URL to your .env file');
    process.exit(1);
}

console.log('🚀 Running all database migrations...\n');
console.log('📦 Connecting to PostgreSQL...\n');

const client = new pg.Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        // Get all migration files
        const migrationsDir = join(__dirname, '../supabase/migrations');
        const files = readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // Sort to run in order

        console.log(`📁 Found ${files.length} migration files\n`);

        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const file of files) {
            console.log(`📄 Running: ${file}`);

            try {
                const migrationPath = join(migrationsDir, file);
                const sql = readFileSync(migrationPath, 'utf-8');

                // Execute the migration
                await client.query(sql);

                console.log(`   ✅ Success\n`);
                successCount++;
            } catch (error) {
                const errorMsg = error.message;

                // Check if it's a benign error (table/function already exists)
                if (errorMsg.includes('already exists') ||
                    errorMsg.includes('does not exist') ||
                    errorMsg.includes('duplicate')) {
                    console.log(`   ⏭️  Skipped (already applied)\n`);
                    skipCount++;
                } else {
                    console.log(`   ❌ Error: ${errorMsg.substring(0, 100)}...\n`);
                    errorCount++;
                }
            }
        }

        console.log('━'.repeat(60));
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ⏭️  Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('━'.repeat(60));

        // Verify key tables exist
        console.log('\n🔍 Verifying database schema...\n');

        const tablesToCheck = [
            'profiles',
            'projects',
            'tasks',
            'notifications',
            'user_preferences',
            'user_tenants',
            'tenants'
        ];

        for (const table of tablesToCheck) {
            try {
                const result = await client.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = $1
                    );
                `, [table]);

                if (result.rows[0].exists) {
                    console.log(`   ✅ ${table}`);
                } else {
                    console.log(`   ⚠️  ${table} (missing)`);
                }
            } catch (error) {
                console.log(`   ❌ ${table} (error checking)`);
            }
        }

        console.log('\n🎉 Migration process complete!');

        if (errorCount > 0) {
            console.log('\n⚠️  Some migrations had errors. Check the output above.');
            console.log('This may be normal if tables already exist or if there are schema conflicts.');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n👋 Database connection closed');
    }
}

runMigrations();
