import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    console.log('🚀 Running admin UI migration...\n');

    try {
        // Read migration file
        const sql = readFileSync(
            join(process.cwd(), 'supabase/migrations/admin_ui_tables.sql'),
            'utf8'
        );

        // Split into statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📝 Found ${statements.length} SQL statements\n`);

        let success = 0;
        let failed = 0;

        for (let i = 0; i < statements.length; i++) {
            const stmt = statements[i];

            try {
                // Execute via Supabase REST API
                const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'apikey': supabaseServiceKey,
                        'Authorization': `Bearer ${supabaseServiceKey}`
                    },
                    body: JSON.stringify({ query: stmt })
                });

                if (response.ok) {
                    success++;
                    process.stdout.write(`✅ ${i + 1}/${statements.length}\r`);
                } else {
                    failed++;
                    const error = await response.text();
                    console.log(`\n❌ Statement ${i + 1} failed: ${error}`);
                }
            } catch (err: any) {
                failed++;
                console.log(`\n❌ Statement ${i + 1} error: ${err.message}`);
            }
        }

        console.log(`\n\n📊 Results:`);
        console.log(`   ✅ Success: ${success}`);
        console.log(`   ❌ Failed: ${failed}`);
        console.log(`   📝 Total: ${statements.length}\n`);

        if (failed > 0) {
            console.log('⚠️  Some statements failed.');
            console.log('💡 Please run migration via Supabase Dashboard SQL Editor\n');
            process.exit(1);
        }

        console.log('✅ Migration completed successfully!\n');
    } catch (error: any) {
        console.error('❌ Migration failed:', error.message);
        console.log('\n💡 Run via Supabase Dashboard:');
        console.log('   Dashboard → SQL Editor → New Query → Paste SQL\n');
        process.exit(1);
    }
}

runMigration();
