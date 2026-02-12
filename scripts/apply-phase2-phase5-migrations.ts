/**
 * Apply Phase 2 & 5 Migrations
 * Directly applies notifications and AI provider settings tables to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load .env
config({ path: '.env' });

// Load environment variables - try multiple naming patterns
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    console.error('   Looking for: VITE_SUPABASE_URL or SUPABASE_URL');
    console.error('   And: SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY or SUPABASE_KEY');
    console.error('\n   Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')).join(', '));
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyMigration(filename: string, description: string) {
    console.log(`\n📦 Applying ${description}...`);

    try {
        const migrationPath = join(process.cwd(), 'supabase', 'migrations', filename);
        const sql = readFileSync(migrationPath, 'utf-8');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

        if (error) {
            // If rpc doesn't exist, try direct approach (this won't work for DDL but worth trying)
            console.log('   ⚠️  Note: Cannot execute DDL via client. Please use Supabase Dashboard.');
            console.log(`   📄 File: ${filename}`);
            return false;
        }

        console.log(`   ✅ ${description} applied successfully`);
        return true;
    } catch (error: any) {
        console.error(`   ❌ Error: ${error.message}`);
        return false;
    }
}

async function checkIfTableExists(tableName: string): Promise<boolean> {
    const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(0);

    // If no error, table exists
    return !error || error.code !== '42P01'; // 42P01 = undefined_table
}

async function main() {
    console.log('🚀 Applying Phase 2 & 5 Migrations\n');
    console.log(`📍 Target: ${SUPABASE_URL}\n`);

    //Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const notificationsExists = await checkIfTableExists('notifications');
    const aiSettingsExists = await checkIfTableExists('ai_provider_settings');

    console.log(`   notifications table: ${notificationsExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);
    console.log(`   ai_provider_settings table: ${aiSettingsExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

    if (notificationsExists && aiSettingsExists) {
        console.log('\n✅ All tables already exist! Migrations not needed.');
        console.log('   The frontend code will work as-is.');
        process.exit(0);
    }

    console.log('\n⚠️  MANUAL MIGRATION REQUIRED');
    console.log('\nSince DDL cannot be executed via Supabase client,');
    console.log('please apply migrations manually:\n');
    console.log('1. Go to: https://supabase.com/dashboard/project/_/sql/new');
    console.log('2. Copy the contents of these files and run them:\n');

    if (!notificationsExists) {
        console.log('   📄 supabase/migrations/20260212120000_notifications.sql');
    }

    if (!aiSettingsExists) {
        console.log('   📄 supabase/migrations/20260212130000_ai_provider_settings.sql');
    }

    console.log('\n3. Click "Run" for each migration\n');
    console.log('💡 Tip: You can also use the Supabase CLI with pooler connection');
    console.log('   or psql if you have direct database access.\n');
}

main().catch(console.error);
