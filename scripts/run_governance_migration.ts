import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env file');
    console.error('\n💡 Alternative: Run migration manually via Supabase Dashboard');
    console.error('   1. Open Supabase Dashboard → SQL Editor');
    console.error('   2. Create new query');
    console.error('   3. Copy contents from: supabase/migrations/governance_tables.sql');
    console.error('   4. Paste and run\n');
    process.exit(1);
}

async function runGovernanceMigration() {
    console.log('🚀 Running Governance Tables Migration...\n');

    const sql = postgres(databaseUrl);

    try {
        // Read migration file
        const migrationSql = readFileSync(
            join(process.cwd(), 'supabase/migrations/governance_tables.sql'),
            'utf8'
        );

        console.log('📝 Executing migration SQL...\n');

        // Execute the entire migration as one transaction
        await sql.unsafe(migrationSql);

        console.log('✅ Governance tables migration completed successfully!\n');
        console.log('📌 Tables created:');
        console.log('   - policy_documents');
        console.log('   - approval_workflows');
        console.log('   - approvers');
        console.log('   - compliance_checklists');
        console.log('   - checklist_items\n');
        console.log('📌 Next step: Run seed data');
        console.log('   Command: npx tsx scripts/run_governance_seed.ts [workspace-id]\n');

        await sql.end();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);

        // Check if it's a "already exists" error
        if (error.message.includes('already exists')) {
            console.log('\n⚠️  Tables may already exist. This is OK if you ran the migration before.');
            console.log('✅ You can proceed to seed data:\n');
            console.log('   Command: npx tsx scripts/run_governance_seed.ts [workspace-id]\n');
            await sql.end();
            process.exit(0);
        }

        console.log('\n💡 Manual alternative:');
        console.log('   1. Open Supabase Dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Create new query');
        console.log('   4. Paste contents of: supabase/migrations/governance_tables.sql');
        console.log('   5. Run query\n');

        await sql.end();
        process.exit(1);
    }
}

runGovernanceMigration();
