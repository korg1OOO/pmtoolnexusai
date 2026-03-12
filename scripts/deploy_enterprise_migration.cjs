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

        const sql = fs.readFileSync('supabase/migrations/20260214_enterprise_multitenancy.sql', 'utf8');

        // Split into sections and execute one by one
        const sections = sql.split('-- ============================================');

        for (let i = 0; i < sections.length; i++) {
            const section = sections[i].trim();
            if (!section) continue;

            const firstLine = section.split('\n')[0];
            console.log(`\nExecuting section ${i + 1}: ${firstLine}...`);

            try {
                await client.query(section);
                console.log(`✓ Section ${i + 1} completed`);
            } catch (error) {
                console.error(`✗ Section ${i + 1} failed:`, error.message);
                console.error('SQL:', section.substring(0, 200));
                throw error;
            }
        }

        console.log('\n✓ Migration completed successfully');

        // Verify tables
        const { rows } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('tenants', 'workspaces', 'portfolios', 'workspace_members', 'ml_manual_learnings', 'ml_pattern_sharing_log')
            ORDER BY table_name
        `);

        console.log('✓ Tables created:', rows.map(r => r.table_name).join(', '));

    } catch (error) {
        console.error('\n✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
