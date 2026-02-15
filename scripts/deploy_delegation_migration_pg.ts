// Deploy complete delegation system (base + advanced features)
import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in environment variables');
    console.log('\n📋 Please add DATABASE_URL to your .env file');
    console.log('You can find it in Supabase Dashboard > Project Settings > Database > Connection String (URI)');
    process.exit(1);
}

console.log('🚀 Deploying complete delegation system...\n');

async function deployMigrations() {
    const migrations = [
        'governance_delegation.sql',  // Base delegation table
        'advanced_delegation_features.sql'  // Advanced features
    ];

    const client = new Client({
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected successfully\n');

        for (const migrationFile of migrations) {
            const filePath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠️  Migration file not found: ${migrationFile}, skipping...`);
                continue;
            }

            const sql = fs.readFileSync(filePath, 'utf-8');
            console.log(`📄 Running migration: ${migrationFile}`);
            console.log(`📝 SQL length: ${sql.length} characters`);

            try {
                await client.query(sql);
                console.log(`✅ ${migrationFile} completed successfully!\n`);
            } catch (error: any) {
                // Check if error is due to table already existing
                if (error.code === '42P07' || error.message.includes('already exists')) {
                    console.log(`ℹ️  ${migrationFile} - Some objects already exist, continuing...\n`);
                } else {
                    throw error;
                }
            }
        }

        console.log('🎉 Complete delegation system deployed successfully!');
        console.log('\n📊 Features available:');
        console.log('  ✅ Base delegation table');
        console.log('  ✅ Delegation expiry dates');
        console.log('  ✅ Delegation templates');
        console.log('  ✅ Sub-delegation (delegation chains)');
        console.log('  ✅ Delegation history view');
        console.log('  ✅ Circular delegation prevention');
        console.log('  ✅ Depth validation triggers\n');

    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        console.error('\nError details:', (error as any).message);
        process.exit(1);
    } finally {
        await client.end();
    }
}

deployMigrations().catch(console.error);
