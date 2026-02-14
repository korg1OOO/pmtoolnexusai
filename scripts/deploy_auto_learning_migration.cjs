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

        const sql = fs.readFileSync('supabase/migrations/20260214_auto_learning_system.sql', 'utf8');

        await client.query(sql);
        console.log('✓ Migration executed successfully');

        // Verify tables were created
        const { rows } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name IN ('ml_auto_learning_config', 'ml_learning_velocity')
        `);

        console.log('✓ Tables created:', rows.map(r => r.table_name).join(', '));

        // Check if default config was inserted
        const { rows: configRows } = await client.query('SELECT * FROM ml_auto_learning_config LIMIT 1');
        console.log('✓ Default config inserted:', configRows.length > 0);

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
