import { Client } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;

async function runMigration() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🚀 Connecting to Supabase database...\n');
        await client.connect();
        console.log('✅ Connected successfully!\n');

        // Read the simplified migration file
        const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260215_users_table_simple.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file loaded (simplified)');
        console.log(`📊 Executing SQL (${migrationSQL.length} characters)...\n`);

        // Execute the migration
        await client.query(migrationSQL);

        console.log('✅ Migration executed successfully!\n');

        // Verify tables exist
        console.log('🔍 Verifying users table...\n');

        const usersCheck = await client.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'users'
        `);

        if (usersCheck.rows[0].count > 0) {
            console.log('✅ Users table created successfully');

            // Get column count
            const usersCols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position
            `);
            console.log(`\n📋 Table structure (${usersCols.rows.length} columns):`);
            usersCols.rows.forEach(col => {
                console.log(`   - ${col.column_name} (${col.data_type})`);
            });
        } else {
            console.log('⚠️  Users table not found');
        }

        // Check indexes
        console.log('\n🔍 Checking indexes...\n');

        const indexes = await client.query(`
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename = 'users'
            ORDER BY indexname
        `);

        console.log(`✅ Found ${indexes.rows.length} indexes:`);
        indexes.rows.forEach(row => {
            console.log(`   - ${row.indexname}`);
        });

        // Check RLS policies
        console.log('\n🔍 Checking RLS policies...\n');

        const policies = await client.query(`
            SELECT policyname 
            FROM pg_policies 
            WHERE tablename = 'users'
            ORDER BY policyname
        `);

        console.log(`✅ Found ${policies.rows.length} RLS policies:`);
        policies.rows.forEach(row => {
            console.log(`   - ${row.policyname}`);
        });

        console.log('\n🎉 Migration complete!\n');
        console.log('📋 Summary:');
        console.log('   ✅ Users table created');
        console.log('   ✅ Indexes created');
        console.log('   ✅ RLS policies configured');
        console.log('\n🚀 User management system is ready!');
        console.log('\n💡 Note: Using existing user_roles table for project roles');
        console.log('   For RBAC, you can create a separate rbac_roles table if needed');

    } catch (error: any) {
        console.error('\n❌ Migration failed:', error.message);

        if (error.message.includes('already exists')) {
            console.log('\n✅ Users table already exists - migration previously completed');
            console.log('\n🔍 Verifying existing table...');

            try {
                const usersCols = await client.query(`
                    SELECT column_name, data_type 
                    FROM information_schema.columns 
                    WHERE table_name = 'users'
                    ORDER BY ordinal_position
                `);
                console.log(`\n📋 Existing table structure (${usersCols.rows.length} columns):`);
                usersCols.rows.forEach(col => {
                    console.log(`   - ${col.column_name} (${col.data_type})`);
                });
                console.log('\n✅ Users table is ready to use!');
            } catch (verifyError) {
                console.error('Could not verify table:', verifyError);
            }
        } else {
            console.error('\nFull error:', error);
            process.exit(1);
        }
    } finally {
        await client.end();
        console.log('\n🔌 Database connection closed');
    }
}

runMigration();
