const fs = require('fs');
const { Client } = require('pg');

async function runMigration() {
    const client = new Client({
        connectionString: 'postgresql://postgres:ZjcJszLxFbP4YiE3@db.rlnaylyjxjjaqzwpuhar.supabase.co:5432/postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✓ Connected to database');

        const sql = fs.readFileSync('supabase/migrations/20260214_advanced_ml_features.sql', 'utf8');

        await client.query(sql);
        console.log('✓ Migration executed successfully');

        // Verify tables were created
        const { rows } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('ml_ab_tests', 'ml_ab_test_results', 'ml_pattern_versions', 'ml_pattern_changelog')
        `);

        console.log('✓ Tables created:', rows.map(r => r.table_name).join(', '));

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
