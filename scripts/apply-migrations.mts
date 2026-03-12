/**
 * Apply Stripe migrations using direct PostgreSQL connection
 */

import pg from 'pg';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const { Client } = pg;

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env file');
    process.exit(1);
}

async function executeSQLFile(client: pg.Client, filePath: string, migrationName: string) {
    console.log(`\n📄 Applying ${migrationName}...`);

    try {
        const sql = readFileSync(filePath, 'utf-8');

        // Execute the entire migration file
        await client.query(sql);

        console.log(`   ✅ Migration applied successfully`);
        return { success: true };
    } catch (error: any) {
        console.error(`   ❌ Failed to apply ${migrationName}:`);
        console.error(`   Error: ${error.message}`);

        // Show more context for debugging
        if (error.position) {
            console.error(`   Position: ${error.position}`);
        }

        return { success: false, error: error.message };
    }
}

async function applyMigrations() {
    console.log('🚀 Starting Stripe Migration Application\n');
    console.log(`Database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

    const client = new Client({
        connectionString: databaseUrl,
    });

    try {
        await client.connect();
        console.log('✅ Connected to database\n');

        const migrations = [
            {
                file: join(__dirname, '../supabase/migrations/20260212200000_stripe_integration.sql'),
                name: 'Stripe Integration (base tables)',
            },
            {
                file: join(__dirname, '../supabase/migrations/20260212210000_invoice_management.sql'),
                name: 'Invoice Management',
            },
            {
                file: join(__dirname, '../supabase/migrations/20260212220000_advanced_subscription_features.sql'),
                name: 'Advanced Features (usage, dunning, analytics)',
            },
        ];

        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];

        for (const migration of migrations) {
            const result = await executeSQLFile(client, migration.file, migration.name);
            if (result.success) {
                successCount++;
            } else {
                failureCount++;
                errors.push(`${migration.name}: ${result.error}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary');
        console.log('='.repeat(60));
        console.log(`✅ Successful migrations: ${successCount}/${migrations.length}`);
        console.log(`❌ Failed migrations: ${failureCount}/${migrations.length}`);

        if (failureCount === 0) {
            console.log('\n🎉 All migrations applied successfully!');
            console.log('\n📋 Changes Applied:');
            console.log('   ✓ subscriptions table updated (Stripe fields)');
            console.log('   ✓ payments table created');
            console.log('   ✓ stripe_events table created');
            console.log('   ✓ invoices table created');
            console.log('   ✓ invoice_line_items table created');
            console.log('   ✓ usage_records table created');
            console.log('   ✓ dunning_attempts table created');
            console.log('   ✓ proration_credits table created');
            console.log('   ✓ subscription_analytics view created');
            console.log('   ✓ tier_analytics view created');
            console.log('\n📋 Next steps:');
            console.log('   1. Deploy Edge Functions: ./scripts/deploy-stripe-features.sh');
            console.log('   2. Configure Stripe webhook in Dashboard');
            console.log('   3. Test the integration');
        } else {
            console.error('\n⚠️  Some migrations failed:');
            errors.forEach(err => console.error(`   - ${err}`));
            console.error('\n💡 Tip: Check if tables already exist or if there are conflicts.');
        }

    } catch (error: any) {
        console.error('\n❌ Connection error:', error.message);
        process.exit(1);
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

applyMigrations().catch(console.error);
