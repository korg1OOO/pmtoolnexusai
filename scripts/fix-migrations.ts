import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

let SUPABASE_URL = '';
let SUPABASE_KEY = '';

envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        const key = match[1].trim();
        const value = match[2].replace(/^["']|["']$/g, '').trim();
        if (key === 'VITE_SUPABASE_URL') SUPABASE_URL = value;
        if (key === 'VITE_SUPABASE_PUBLISHABLE_KEY') SUPABASE_KEY = value;
    }
});

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Error: Could not load Supabase credentials from .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function createMissingFunction() {
    console.log('🔧 Creating missing handle_updated_at function...\n');

    const sql = `
    CREATE OR REPLACE FUNCTION public.handle_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        // Try alternative approach using direct query
        console.log('⚠️  Direct RPC failed, this is expected. The function needs to be created via SQL Editor.\n');
        console.log('📋 Please run this SQL in Supabase SQL Editor:\n');
        console.log('='
            .repeat(60));
        console.log(sql);
        console.log('='.repeat(60));
        console.log('\nThen run: /tmp/supabase db push --include-all\n');
        return false;
    }

    console.log('✅ Function created successfully!\n');
    return true;
}

async function main() {
    console.log('🚀 Fix Remaining Migrations\n');
    console.log('═══════════════════════════════\n');

    const success = await createMissingFunction();

    if (!success) {
        console.log('⏭️  Next steps:\n');
        console.log('1. Copy the SQL above');
        console.log(`2. Go to: ${SUPABASE_URL.replace('https://', 'https://supabase.com/dashboard/project/')}/sql/new`);
        console.log('3. Paste and run the SQL');
        console.log('4. Run: /tmp/supabase db push --include-all\n');
        process.exit(1);
    }

    console.log('✅ Ready to apply remaining migrations!');
    console.log('\nRun: /tmp/supabase db push --include-all\n');
}

main().catch(console.error);
