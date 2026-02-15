// Deploy approval analytics views migration
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    process.exit(1);
}

console.log('🚀 Deploying approval analytics views migration...\n');

async function deployMigration() {
    const migrationFile = 'approval_analytics_views.sql';
    const filePath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');
    console.log(`📄 Migration file: ${migrationFile}`);
    console.log(`📝 SQL length: ${sql.length} characters\n`);

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');

        console.log('⚙️  Executing migration SQL...');
        await client.query(sql);
        console.log('✅ Migration executed successfully!\n');

        console.log('🎉 Approval analytics views deployed!');
        console.log('\n📊 Views created:');
        console.log('  ✅ approval_metrics - Aggregate metrics per entity');
        console.log('  ✅ approval_trends - Daily trends for last 90 days');
        console.log('  ✅ approval_bottlenecks - Stuck approvals analysis');
        console.log('  ✅ delegation_patterns - Delegation behavior patterns');
        console.log('  ✅ approver_performance - Individual approver metrics');
        console.log('  ✅ compliance_metrics - Compliance completion data\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nError details:', (error as any).message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deployMigration().catch(console.error);
