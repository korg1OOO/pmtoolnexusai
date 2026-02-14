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

        const sql = fs.readFileSync('supabase/migrations/20260214_programs_and_hierarchy.sql', 'utf8');

        await client.query(sql);
        console.log('✓ Migration executed successfully');

        // Verify tables were created
        const { rows: tables } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('programs', 'program_members', 'program_milestones', 'cross_project_dependencies')
            ORDER BY table_name
        `);

        console.log('✓ Tables created:', tables.map(r => r.table_name).join(', '));

        // Verify default program
        const { rows: programs } = await client.query('SELECT * FROM programs WHERE code = $1', ['DEFAULT']);
        console.log('✓ Default program created:', programs.length > 0 ? programs[0].name : 'NOT FOUND');

        // Verify projects linked to program
        const { rows: linkedProjects } = await client.query('SELECT COUNT(*) as count FROM projects WHERE program_id IS NOT NULL');
        console.log('✓ Projects linked to programs:', linkedProjects[0].count);

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
