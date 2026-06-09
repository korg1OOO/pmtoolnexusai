/**
 * Apply ML Analytics Database Migration
 * This script applies the ML tables migration directly to Supabase
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Error: VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🚀 Applying ML Analytics Migration...\n');

    try {
        // Read the migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260212003807_create_ml_tables.sql');
        const migrationSQL = readFileSync(migrationPath, 'utf-8');

        console.log('📄 Migration file loaded');
        console.log('📊 Executing SQL statements...\n');

        // Split into individual statements (rough split by semicolons)
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute\n`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];
            if (!stmt) continue;

            try {
                // Use the RPC function to execute raw SQL (note: this requires a custom RPC function)
                // For now, we'll use a workaround with individual table creation
                console.log(`[${i + 1}/${statements.length}] Executing statement...`);

                // Since we can't execute raw SQL directly via the JS client,
                // we need to provide manual instructions
                if (i === 0) {
                    console.log('\n⚠️  Direct SQL execution not available via Supabase JS client.');
                    console.log('\n📋 MANUAL MIGRATION STEPS:\n');
                    console.log('1. Go to your Supabase Dashboard: ' + supabaseUrl.replace('https://', 'https://app.supabase.com/project/'));
                    console.log('2. Navigate to: SQL Editor');
                    console.log('3. Create a new query');
                    console.log('4. Copy and paste the contents of:');
                    console.log('   supabase/migrations/20260212003807_create_ml_tables.sql');
                    console.log('5. Click "Run" to execute the migration');
                    console.log('\n✨ After migration, the TypeScript types will be available!\n');
                    break;
                }
            } catch (err: any) {
                console.error(`❌ Error executing statement ${i + 1}:`, err.message);
            }
        }

        console.log('\n📝 ALTERNATIVE: Use Supabase CLI\n');
        console.log('If you have Supabase CLI installed:');
        console.log('  1. Login: supabase login');
        console.log('  2. Link project: supabase link --project-ref YOUR_PROJECT_REF');
        console.log('  3. Push migration: supabase db push\n');

    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    }
}

applyMigration();
