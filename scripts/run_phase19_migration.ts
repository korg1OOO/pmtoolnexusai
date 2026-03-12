/**
 * Migration Runner for Phase 19: Health Monitoring
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
            'supabase/migrations/20260212052500_phase19_health_monitoring.sql'
        );
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Running Phase 19 migration...\n');
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify tables
        console.log('🔍 Verifying created objects:\n');

        const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('system_metrics', 'service_status', 'performance_thresholds')
      ORDER BY table_name;
    `);

        console.log('✅ Tables created:');
        tables.forEach((table: { table_name: string }) => {
            console.log(`   - ${table.table_name}`);
        });

        const { rows: views } = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
        AND table_name IN ('system_health_summary', 'recent_metrics_summary', 'metric_threshold_violations')
      ORDER BY table_name;
    `);

        console.log('\n✅ Views created:');
        views.forEach((view: { table_name: string }) => {
            console.log(`   - ${view.table_name}`);
        });

        const { rows: functions } = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
        AND routine_name IN ('record_system_metric', 'update_service_status', 'check_metric_threshold')
      ORDER BY routine_name;
    `);

        console.log('\n✅ Functions created:');
        functions.forEach((func: { routine_name: string }) => {
            console.log(`   - ${func.routine_name}()`);
        });

        // Verify default thresholds
        const { rows: thresholds } = await client.query(`
      SELECT metric_type, warning_threshold, critical_threshold, unit 
      FROM performance_thresholds 
      ORDER BY metric_type;
    `);

        console.log('\n✅ Default thresholds created:');
        thresholds.forEach((threshold: { metric_type: string; warning_threshold: number; critical_threshold: number; unit: string }) => {
            console.log(`   - ${threshold.metric_type}: ${threshold.warning_threshold}${threshold.unit} (warn) / ${threshold.critical_threshold}${threshold.unit} (crit)`);
        });

        console.log('\n═══════════════════════════════════════════════════');
        console.log('🎉 Phase 19 Migration Complete!');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('Next steps:');
        console.log('1. Create health monitoring hooks in src/hooks/useHealthMonitoring.ts');
        console.log('2. Build AdminHealthCheck.tsx component');
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
