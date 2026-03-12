/**
 * Database Migration Runner using PostgreSQL
 * Runs SQL migration using direct PostgreSQL connection
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Pool } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
    console.log('🚀 Starting database migration...\n');

    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('❌ Error: DATABASE_URL not found in .env file');
        process.exit(1);
    }

    console.log(`📍 Database: ${databaseUrl.split('@')[1]?.split('/')[0] || 'configured'}`);

    // Create PostgreSQL pool
    const pool = new Pool({
        connectionString: databaseUrl,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        // Test connection
        console.log('🔌 Testing database connection...');
        const client = await pool.connect();
        console.log('✅ Connected to database\n');

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260212300000_email_template_management.sql');
        console.log(`📄 Reading migration: 20260212300000_email_template_management.sql`);

        let migrationSQL;
        try {
            migrationSQL = readFileSync(migrationPath, 'utf-8');
            console.log(`✅ Migration file loaded (${migrationSQL.length} characters)\n`);
        } catch (error) {
            console.error(`❌ Error reading migration file: ${error.message}`);
            client.release();
            process.exit(1);
        }

        console.log('⏳ Executing migration (this may take a few seconds)...\n');

        // Execute the entire migration as a single transaction
        try {
            await client.query('BEGIN');
            await client.query(migrationSQL);
            await client.query('COMMIT');

            console.log('✅ Migration executed successfully!\n');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');

        const tablesToCheck = [
            'email_templates_admin',
            'email_template_versions',
            'imap_accounts',
            'imap_presets',
            'notification_analytics',
            'notification_channels',
            'user_device_tokens'
        ];

        for (const table of tablesToCheck) {
            try {
                const result = await client.query(
                    `SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )`,
                    [table]
                );

                if (result.rows[0].exists) {
                    console.log(`   ✅ ${table}`);
                } else {
                    console.log(`   ❌ ${table}: Not found`);
                }
            } catch (error) {
                console.log(`   ❌ ${table}: ${error.message}`);
            }
        }

        // Check seeded data
        console.log('\n📊 Checking seeded data...\n');

        try {
            const templatesResult = await client.query('SELECT COUNT(*) FROM email_templates_admin');
            console.log(`   ✅ Email templates: ${templatesResult.rows[0].count} records`);

            const presetsResult = await client.query('SELECT COUNT(*) FROM imap_presets');
            console.log(`   ✅ IMAP presets: ${presetsResult.rows[0].count} records`);
        } catch (error) {
            console.log(`   ⚠️  Could not verify seeded data: ${error.message}`);
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Migration completed successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Next steps:');
        console.log('   1. Deploy Edge Function: supabase functions deploy notification-scheduler');
        console.log('   2. Add admin routes to navigation');
        console.log('   3. Test the Email Template Manager UI');
        console.log('\n✨ Done!\n');

        client.release();
    } catch (error) {
        console.error('\n❌ Migration failed:');
        console.error(`   ${error.message}`);

        if (error.detail) {
            console.error(`   Detail: ${error.detail}`);
        }

        if (error.hint) {
            console.error(`   Hint: ${error.hint}`);
        }

        process.exit(1);
    } finally {
        await pool.end();
    }
}

// Run migration
runMigration().catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
});
