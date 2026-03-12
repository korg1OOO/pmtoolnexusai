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

        // Read migration file
        const sql = fs.readFileSync('supabase/migrations/20260214_phase4_meetings_collaboration.sql', 'utf8');

        console.log('\n📦 Running Phase 4 migration...\n');

        await client.query(sql);

        console.log('✓ Migration completed successfully\n');

        // Verify tables
        console.log('🔍 Verifying tables...\n');

        const tables = [
            'meeting_attendees',
            'meeting_action_items',
            'meeting_templates',
            'meeting_notes',
            'collaboration_spaces',
            'collaboration_space_members'
        ];

        for (const table of tables) {
            const { rows } = await client.query(`
                SELECT COUNT(*) as count 
                FROM information_schema.tables 
                WHERE table_name = $1
            `, [table]);

            if (rows[0].count > 0) {
                console.log(`✓ Table '${table}' created`);
            } else {
                console.log(`✗ Table '${table}' NOT found`);
            }
        }

        // Verify meetings table columns
        console.log('\n🔍 Verifying meetings table columns...\n');

        const columns = [
            'tenant_id',
            'workspace_id',
            'portfolio_id',
            'program_id',
            'meeting_scope',
            'meeting_type',
            'is_recurring',
            'recurrence_pattern',
            'tags'
        ];

        const { rows: meetingColumns } = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'meetings'
            AND column_name = ANY($1)
        `, [columns]);

        const foundColumns = meetingColumns.map(r => r.column_name);

        columns.forEach(col => {
            if (foundColumns.includes(col)) {
                console.log(`✓ Column 'meetings.${col}' added`);
            } else {
                console.log(`✗ Column 'meetings.${col}' NOT found`);
            }
        });

        // Verify functions
        console.log('\n🔍 Verifying functions...\n');

        const functions = [
            'populate_meeting_hierarchy',
            'update_action_item_timestamp',
            'update_meeting_note_timestamp',
            'increment_meeting_template_usage',
            'update_collaboration_space_timestamp'
        ];

        for (const func of functions) {
            const { rows } = await client.query(`
                SELECT COUNT(*) as count 
                FROM pg_proc 
                WHERE proname = $1
            `, [func]);

            if (rows[0].count > 0) {
                console.log(`✓ Function '${func}()' created`);
            } else {
                console.log(`✗ Function '${func}()' NOT found`);
            }
        }

        console.log('\n✅ Phase 4 migration verification complete!\n');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error(error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
