/**
 * Run Admin Tables Migration
 * Creates subscriptions, discount_codes, and license_keys tables
 */

import { config } from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected');

        // Read migration file
        const migrationPath = join(process.cwd(), 'supabase/migrations/20260212012600_admin_tables.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('\n📝 Running admin tables migration...');
        await client.query(migrationSQL);
        console.log('✅ Migration completed successfully');

        // Verify tables were created
        console.log('\n🔍 Verifying tables...');
        const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('subscriptions', 'discount_codes', 'discount_code_usage', 'license_keys', 'license_key_activations')
      ORDER BY table_name;
    `);

        console.log('\n✅ Tables created:');
        tableCheck.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Check indexes
        const indexCheck = await client.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename IN ('subscriptions', 'discount_codes', 'license_keys')
      ORDER BY tablename, indexname;
    `);

        console.log(`\n✅ Indexes created: ${indexCheck.rows.length}`);

        // Check triggers
        const triggerCheck = await client.query(`
      SELECT trigger_name, event_object_table
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      AND event_object_table IN ('subscriptions', 'discount_codes', 'license_keys', 'discount_code_usage', 'license_key_activations')
      ORDER BY event_object_table, trigger_name;
    `);

        console.log(`✅ Triggers created: ${triggerCheck.rows.length}`);
        triggerCheck.rows.forEach(row => {
            console.log(`   - ${row.trigger_name} on ${row.event_object_table}`);
        });

        console.log('\n🎉 Admin tables migration completed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

runMigration();
