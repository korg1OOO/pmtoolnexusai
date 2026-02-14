import { Client } from 'pg';
import * as dotenv from 'dotenv';

// Load .env file
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL!;

async function checkSchema() {
    const client = new Client({
        connectionString: DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        console.log('🔍 Checking existing database schema...\n');
        await client.connect();
        console.log('✅ Connected\n');

        // Check if users table exists
        const usersExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'users'
            );
        `);

        console.log('📋 Users table:', usersExists.rows[0].exists ? '✅ EXISTS' : '❌ NOT FOUND');

        if (usersExists.rows[0].exists) {
            const usersCols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users'
                ORDER BY ordinal_position;
            `);
            console.log('\n  Columns:');
            usersCols.rows.forEach(col => {
                console.log(`    - ${col.column_name} (${col.data_type})`);
            });
        }

        // Check if user_roles table exists
        const rolesExists = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'user_roles'
            );
        `);

        console.log('\n📋 User_roles table:', rolesExists.rows[0].exists ? '✅ EXISTS' : '❌ NOT FOUND');

        if (rolesExists.rows[0].exists) {
            const rolesCols = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'user_roles'
                ORDER BY ordinal_position;
            `);
            console.log('\n  Columns:');
            rolesCols.rows.forEach(col => {
                console.log(`    - ${col.column_name} (${col.data_type})`);
            });
        }

        console.log('\n✅ Schema check complete');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.end();
    }
}

checkSchema();
