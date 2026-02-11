/**
 * Run Advanced Features Migration
 */

import { config } from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected');

        const migrationPath = join(process.cwd(), 'supabase/migrations/20260212013900_advanced_features.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('\n📝 Running advanced features migration...');
        await client.query(migrationSQL);
        console.log('✅ Migration completed');

        // Verify tables
        const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('email_preferences', 'referral_codes', 'referral_conversions')
      ORDER BY table_name;
    `);

        console.log('\n✅ New tables:');
        tableCheck.rows.forEach(row => console.log(`   - ${row.table_name}`));

        // Verify views
        const viewCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      AND table_name LIKE 'analytics_%'
      ORDER BY table_name;
    `);

        console.log(`\n✅ Analytics views created: ${viewCheck.rows.length}`);
        viewCheck.rows.forEach(row => console.log(`   - ${row.table_name}`));

        console.log('\n🎉 Advanced features migration successful!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
