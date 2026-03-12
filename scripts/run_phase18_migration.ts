/**
 * Migration Runner for Phase 18: Admin User Management
 */

import { config } from 'dotenv';
import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

config({ path: join(process.cwd(), '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
}

async function runMigration() {
    const client = new Client({ connectionString: DATABASE_URL });

    try {
        console.log('🔌 Connecting to database...\n');
        await client.connect();

        // Read migration file
        const migrationPath = join(
            process.cwd(),
            'supabase/migrations/20260212020000_phase18_admin_management.sql'
        );
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Running Phase 18 migration...\n');
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify tables
        console.log('🔍 Verifying created objects:\n');

        const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('admin_roles', 'admin_users', 'admin_activity_log')
      ORDER BY table_name;
    `);

        console.log('✅ Tables created:');
        tables.forEach((table) => {
            console.log(`   - ${table.table_name}`);
        });

        const { rows: views } = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name IN ('active_admin_users', 'admin_activity_summary')
      ORDER BY table_name;
    `);

        console.log('\n✅ Views created:');
        views.forEach((view) => {
            console.log(`   - ${view.table_name}`);
        });

        const { rows: functions } = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN ('check_admin_permission', 'log_admin_activity')
      ORDER BY routine_name;
    `);

        console.log('\n✅ Functions created:');
        functions.forEach((func) => {
            console.log(`   - ${func.routine_name}()`);
        });

        // Verify default roles
        const { rows: roles } = await client.query(`
      SELECT name, description, is_system_role 
      FROM admin_roles 
      ORDER BY name;
    `);

        console.log('\n✅ Default roles created:');
        roles.forEach((role) => {
            const systemBadge = role.is_system_role ? '[SYSTEM]' : '';
            console.log(`   - ${role.name} ${systemBadge}`);
            console.log(`     ${role.description}`);
        });

        console.log('\n═══════════════════════════════════════════════════');
        console.log('🎉 Phase 18 Migration Complete!');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('Next steps:');
        console.log('1. Create admin hooks in src/hooks/useAdminManagement.ts');
        console.log('2. Build AdminManagement.tsx component');
        console.log('3. Update admin navigation');
        console.log('');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runMigration();
