// Run advanced delegation features migration
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

console.log('🚀 Running advanced delegation features migration...\n');
console.log(`📍 Supabase URL: ${supabaseUrl}\n`);

async function runMigration() {
    const migrationFile = 'advanced_delegation_features.sql';
    console.log(`📄 Running migration: ${migrationFile}`);

    const filePath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(filePath)) {
        console.error(`❌ Migration file not found: ${filePath}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(filePath, 'utf-8');

    console.log(`📝 Migration file loaded (${sql.length} characters)`);
    console.log('🔄 Executing SQL...\n');

    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        // Split SQL into individual statements
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));

        console.log(`📊 Found ${statements.length} SQL statements to execute\n`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            console.log(`⚙️  Executing statement ${i + 1}/${statements.length}...`);

            const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

            if (error) {
                console.error(`❌ Statement ${i + 1} failed:`, error);
                console.error(`Statement: ${statement.substring(0, 100)}...`);
                throw error;
            }

            console.log(`✅ Statement ${i + 1} completed`);
        }

        console.log(`\n✅ ${migrationFile} completed successfully!`);
        console.log('🎉 Advanced delegation features migration complete!\n');
        return true;
    } catch (error) {
        console.error(`\n❌ Migration failed:`, error);
        return false;
    }
}

runMigration()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
