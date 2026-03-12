const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function deployMigration() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL,
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260214_phase5_meeting_analytics.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📝 Running Phase 5.1 Meeting Analytics migration...');
        await client.query(migrationSQL);
        console.log('✅ Migration completed successfully\n');

        // Verify tables were created
        console.log('🔍 Verifying migration...');

        const tables = ['meeting_analytics', 'attendance_patterns', 'meeting_trends'];
        for (const table of tables) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                )
            `, [table]);

            if (result.rows[0].exists) {
                console.log(`  ✅ Table '${table}' created`);
            } else {
                console.log(`  ❌ Table '${table}' NOT found`);
            }
        }

        // Verify functions
        console.log('\n🔍 Verifying functions...');
        const functions = ['calculate_meeting_analytics', 'update_attendance_patterns'];
        for (const func of functions) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM pg_proc 
                    WHERE proname = $1
                )
            `, [func]);

            if (result.rows[0].exists) {
                console.log(`  ✅ Function '${func}' created`);
            } else {
                console.log(`  ❌ Function '${func}' NOT found`);
            }
        }

        console.log('\n✨ Phase 5.1 migration deployment complete!');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error.stack);
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run if called directly
if (require.main === module) {
    deployMigration();
}

module.exports = { deployMigration };
