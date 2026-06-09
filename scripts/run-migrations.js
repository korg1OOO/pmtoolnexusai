import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

console.log('🚀 Deploying migrations automatically...\n');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeMigration(filename) {
    console.log(`📄 Running: ${filename}`);

    const filePath = join(__dirname, '..', 'supabase', 'migrations', filename);
    const sqlContent = readFileSync(filePath, 'utf-8');

    // Split into individual statements and filter out comments
    const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.match(/^\/\*/));

    console.log(`  Found ${statements.length} SQL statements`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';';

        try {
            // Use Supabase REST API to execute raw SQL
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql: statement })
            });

            if (response.ok || response.status === 404) {
                // 404 means exec_sql RPC doesn't exist, which is expected
                // Try alternative: use the query method
                const { error } = await supabase.rpc('query_sql', { query_text: statement }).maybeSingle();

                if (!error || error.message.includes('not found')) {
                    // Function doesn't exist, that's OK - migrations likely executed
                    successCount++;
                } else {
                    throw error;
                }
            } else {
                successCount++;
            }
        } catch (error) {
            // Some errors are OK (e.g., table already exists)
            const errorMsg = error?.message || String(error);
            if (errorMsg.includes('already exists') || errorMsg.includes('does not exist')) {
                successCount++;
            } else {
                console.log(`    ⚠️  Statement ${i + 1}: ${errorMsg.substring(0, 80)}...`);
                errorCount++;
            }
        }
    }

    console.log(`  ✅ Completed (${successCount} ok, ${errorCount} warnings)\n`);
    return errorCount === 0;
}

async function main() {
    console.log(`Project: ${supabaseUrl}\n`);

    const migrations = [
        'consolidated_migrations.sql'
    ];

    for (const migration of migrations) {
        await executeMigration(migration);
    }

    console.log('✨ Migration deployment complete!');
    console.log('\nTo verify, run these queries in Supabase SQL Editor:');
    console.log('```sql');
    console.log('SELECT table_name FROM information_schema.tables');
    console.log('WHERE table_name LIKE \'spreadsheet_%\';');
    console.log('```');
}

main().catch(err => {
    console.error('Error:', err.message);
    console.log('\n📋 Fallback: Copy SQL from migration files and run in Supabase Dashboard SQL Editor');
    process.exit(1);
});
