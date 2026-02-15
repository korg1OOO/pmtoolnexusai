import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ Missing DATABASE_URL in .env file');
    console.error('\n💡 Alternative: Run seed manually via Supabase Dashboard\n');
    process.exit(1);
}

async function runGovernanceSeed() {
    // Get workspace ID from command line or prompt for manual entry
    const workspaceId = process.argv[2];

    if (!workspaceId) {
        console.error('❌ Workspace ID required!');
        console.error('\n📌 Usage: npx tsx scripts/run_governance_seed.ts <workspace-id>');
        console.error('\n💡 To find your workspace ID:');
        console.error('   1. Open your app');
        console.error('   2. Navigate to a workspace');
        console.error('   3. Check the URL or browser console');
        console.error('   4. Or query: SELECT id, name FROM workspaces;\n');
        process.exit(1);
    }

    console.log('🌱 Running Governance Sample Data Seed...\n');
    console.log(`📌 Using workspace ID: ${workspaceId}\n`);

    const sql = postgres(databaseUrl);

    try {
        // Read seed file
        let seedSql = readFileSync(
            join(process.cwd(), 'supabase/migrations/governance_seed.sql'),
            'utf8'
        );

        // Replace placeholder workspace ID with actual ID
        seedSql = seedSql.replace(/00000000-0000-0000-0000-000000000001/g, workspaceId);

        console.log('📝 Executing seed SQL...\n');

        // Execute the seed
        await sql.unsafe(seedSql);

        console.log('✅ Sample governance data seeded successfully!\n');
        console.log('📌 Data created for workspace:', workspaceId);
        console.log('   - 3 policy documents');
        console.log('   - 2 approval workflows');
        console.log('   - 5 approvers');
        console.log('   - 1 compliance checklist (ISO 27001)');
        console.log('   - 4 checklist items\n');
        console.log('🎉 You can now test the Governance Panel with real data!\n');
        console.log('📌 To test:');
        console.log('   1. Open your app');
        console.log('   2. Navigate to workspace analytics');
        console.log('   3. Click "Governance" button');
        console.log('   4. Verify data loads from database\n');

        await sql.end();
        process.exit(0);
    } catch (error: any) {
        console.error('❌ Seed failed:', error.message);
        console.log('\n💡 Manual alternative:');
        console.log('   1. Open Supabase Dashboard → SQL Editor');
        console.log('   2. Create new query');
        console.log('   3. Paste contents of: supabase/migrations/governance_seed.sql');
        console.log(`   4. Replace all instances of 00000000-0000-0000-0000-000000000001 with: ${workspaceId}`);
        console.log('   5. Run query\n');

        await sql.end();
        process.exit(1);
    }
}

runGovernanceSeed();
