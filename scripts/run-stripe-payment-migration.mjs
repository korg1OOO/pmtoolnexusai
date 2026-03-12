/**
 * Stripe Payment Infrastructure Migration Runner
 * Runs SQL migration for Stripe payment tables using direct PostgreSQL connection
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
    console.log('🚀 Starting Stripe Payment Infrastructure Migration...\n');

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
        const migrationPath = join(__dirname, '../supabase/migrations/20260215_stripe_payment_tables.sql');
        console.log(`📄 Reading migration: 20260215_stripe_payment_tables.sql`);

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
            'stripe_customers',
            'payment_methods',
            'user_payment_methods',
            'auto_recharge_logs'
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

        // Check invoice table updates
        console.log('\n📊 Verifying invoice table updates...\n');

        const columnsToCheck = [
            'amount_due',
            'amount_paid',
            'updated_at',
            'stripe_payment_intent_id',
            'refund_amount',
            'refund_date'
        ];

        for (const column of columnsToCheck) {
            try {
                const result = await client.query(
                    `SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'invoices' 
            AND column_name = $1
          )`,
                    [column]
                );

                if (result.rows[0].exists) {
                    console.log(`   ✅ invoices.${column}`);
                } else {
                    console.log(`   ❌ invoices.${column}: Not found`);
                }
            } catch (error) {
                console.log(`   ❌ invoices.${column}: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('🎉 Stripe Payment Migration Completed Successfully!');
        console.log('='.repeat(60));
        console.log('\n📋 Next steps:');
        console.log('   1. Configure Stripe API keys in .env file:');
        console.log('      - VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...');
        console.log('      - VITE_STRIPE_SECRET_KEY=sk_test_...');
        console.log('      - STRIPE_WEBHOOK_SECRET=whsec_...');
        console.log('   2. Test payment functionality in the UI');
        console.log('   3. Set up Stripe webhook endpoints');
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
