// Migration runner script
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;
const dbUrl = process.env.DATABASE_URL!;

console.log('🚀 Running database migrations...\n');

async function runMigration(filename: string) {
    console.log(`📄 Running migration: ${filename}`);

    const filePath = path.join(process.cwd(), 'supabase', 'migrations', filename);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ query: sql })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }

        console.log(`✅ ${filename} completed successfully\n`);
        return true;
    } catch (error) {
        console.error(`❌ ${filename} failed:`, error);
        return false;
    }
}

async function main() {
    const migrations = [
        '20260214_collaboration.sql',
        '202602115_pivot_tables.sql'
    ];

    for (const migration of migrations) {
        const success = await runMigration(migration);
        if (!success) {
            console.error('\n❌ Migration failed. Stopping.');
            process.exit(1);
        }
    }

    console.log('🎉 All migrations completed successfully!');
}

main().catch(console.error);
