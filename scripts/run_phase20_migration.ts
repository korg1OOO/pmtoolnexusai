/**
 * Migration Runner for Phase 20: AI Usage Tracking
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
            'supabase/migrations/20260212061500_phase20_ai_usage_tracking.sql'
        );
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📝 Running Phase 20 migration...\n');
        await client.query(migrationSQL);

        console.log('✅ Migration completed successfully!\n');

        // Verify tables
        console.log('🔍 Verifying created objects:\n');

        const { rows: tables } = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name IN ('ai_usage_logs', 'ai_provider_costs', 'ai_budgets')
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
        AND table_name IN ('ai_usage_summary', 'ai_cost_by_provider', 'ai_usage_by_user', 'ai_budget_status')
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
        AND routine_name IN ('log_ai_usage', 'get_user_monthly_cost')
      ORDER BY routine_name;
    `);

        console.log('\n✅ Functions created:');
        functions.forEach((func: { routine_name: string }) => {
            console.log(`   - ${func.routine_name}()`);
        });

        // Verify default pricing
        const { rows: pricing } = await client.query(`
      SELECT provider, model, prompt_token_cost, completion_token_cost 
      FROM ai_provider_costs 
      ORDER BY provider, model;
    `);

        console.log('\n✅ Default pricing configured:');
        pricing.forEach((price: { provider: string; model: string; prompt_token_cost: string; completion_token_cost: string }) => {
            console.log(`   - ${price.provider}/${price.model}: $${price.prompt_token_cost}/$${price.completion_token_cost} per token`);
        });

        // Verify default budget
        const { rows: budgets } = await client.query(`
      SELECT name, limit_usd, period 
      FROM ai_budgets;
    `);

        console.log('\n✅ Default budgets created:');
        budgets.forEach((budget: { name: string; limit_usd: string; period: string }) => {
            console.log(`   - ${budget.name}: $${budget.limit_usd} (${budget.period})`);
        });

        console.log('\n═══════════════════════════════════════════════════');
        console.log('🎉 Phase 20 Migration Complete!');
        console.log('═══════════════════════════════════════════════════\n');
        console.log('Next steps:');
        console.log('1. Create AI usage hooks in src/hooks/useAIUsage.ts');
        console.log('2. Build AdminAIUsage.tsx component');
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
