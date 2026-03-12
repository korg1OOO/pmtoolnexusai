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

        const sql = fs.readFileSync('supabase/migrations/20260214_phase2_tasks_hierarchy.sql', 'utf8');

        await client.query(sql);
        console.log('✓ Migration executed successfully');

        // Verify tables were created
        const { rows: tables } = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            AND table_name IN ('task_templates', 'task_comments', 'task_links')
            ORDER BY table_name
        `);

        console.log('✓ Tables created:', tables.map(r => r.table_name).join(', '));

        // Verify tasks table columns
        const { rows: cols } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'tasks'
            AND column_name IN ('tenant_id', 'workspace_id', 'portfolio_id', 'program_id', 'visibility_scope', 'shared_across_program', 'milestone_type', 'tags')
            ORDER BY column_name
        `);

        console.log('✓ Tasks columns added:', cols.map(c => c.column_name).join(', '));

        // Check tasks with hierarchy populated
        const { rows: hierarchyTasks } = await client.query(`
            SELECT COUNT(*) as count 
            FROM tasks 
            WHERE tenant_id IS NOT NULL
        `);

        console.log('✓ Tasks with hierarchy populated:', hierarchyTasks[0].count);

    } catch (error) {
        console.error('✗ Migration failed:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
