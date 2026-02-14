const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260214_ai_credits_system.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running AI Credits migration as single transaction...\n');

        // Execute the entire migration as one transaction
        await client.query('BEGIN');

        try {
            await client.query(migrationSQL);
            await client.query('COMMIT');
            console.log('✅ Migration completed successfully!\n');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }

        // Verify tables
        console.log('🔍 Verifying tables...');
        const tables = ['ai_credits', 'ai_usage_logs', 'ai_credit_purchases', 'ai_credit_pricing'];

        for (const table of tables) {
            const result = await client.query(`SELECT COUNT(*) FROM ${table}`);
            console.log(`  ✓ ${table}: ${result.rows[0].count} rows`);
        }

        // Check pricing tiers
        const pricing = await client.query('SELECT tier_name, credits, price FROM ai_credit_pricing ORDER BY display_order');
        console.log(`\n✅ ${pricing.rows.length} pricing tiers loaded:`);
        pricing.rows.forEach(tier => {
            console.log(`   - ${tier.tier_name}: ${tier.credits} credits for $${tier.price}`);
        });

        console.log('\n🎉 AI Credits system deployed successfully!');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
