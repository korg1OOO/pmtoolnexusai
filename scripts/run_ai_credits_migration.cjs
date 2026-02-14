const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env file');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected\n');

        // Read the minimal migration SQL
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'ai_credits_minimal.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running AI Credits migration...\n');

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

        // Verify tables were created
        console.log('🔍 Verifying migration...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name LIKE 'ai_%'
            ORDER BY table_name
        `);

        console.log('\n✅ Tables created:');
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        // Verify pricing data
        const pricingResult = await client.query('SELECT tier_name, credits, price FROM ai_credit_pricing ORDER BY display_order');
        console.log('\n✅ Pricing tiers loaded:');
        pricingResult.rows.forEach(row => {
            console.log(`   - ${row.tier_name}: ${row.credits} credits for $${row.price}`);
        });

        // Verify functions
        const functionsResult = await client.query(`
            SELECT routine_name 
            FROM information_schema.routines 
            WHERE routine_schema = 'public' 
            AND routine_name LIKE '%ai_credit%'
            ORDER BY routine_name
        `);

        console.log('\n✅ Functions created:');
        functionsResult.rows.forEach(row => {
            console.log(`   - ${row.routine_name}()`);
        });

        console.log('\n🎉 Migration complete! AI Credits system is ready.\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
