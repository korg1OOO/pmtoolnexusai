/**
 * Apply ML Analytics Database Migration using direct PostgreSQL connection
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read DATABASE_URL from project root .env file
const envPath = join(__dirname, '../.env');
const envContent = readFileSync(envPath, 'utf-8');
const dbUrlMatch = envContent.match(/DATABASE_URL="([^"]+)"/);

if (!dbUrlMatch) {
    console.error('❌ Error: DATABASE_URL not found in .env');
    process.exit(1);
}

const connectionString = dbUrlMatch[1];

async function runMigration() {
    const client = new Client({ connectionString });

    try {
        console.log('🔌 Connecting to database...\n');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260212003807_create_ml_tables.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file loaded: 20260212003807_create_ml_tables.sql');
        console.log('📊 Executing SQL migration...\n');

        // Execute the entire migration
        await client.query(migrationSQL);

        console.log('✅ Migration applied successfully!\n');

        // Verify tables were created
        console.log('🔍 Verifying tables...\n');
        const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('ml_predictions', 'ml_model_metadata', 'ml_training_data')
      ORDER BY table_name;
    `);

        console.log('✅ Tables created:');
        result.rows.forEach((row: any) => {
            console.log(`   ✓ ${row.table_name}`);
        });

        console.log('\n🎉 Migration completed successfully!');
        console.log('\n📝 Next steps:');
        console.log('   1. Regenerate TypeScript types: npm run db:types');
        console.log('   2. Rebuild the project: npm run build');
        console.log('   3. Run verification: npx tsx scripts/verify_ml_analytics.ts\n');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        if (error.detail) {
            console.error('   Detail:', error.detail);
        }
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
