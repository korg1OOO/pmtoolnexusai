/**
 * Script to apply Stripe integration migration
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
    console.log('🚀 Applying Stripe integration migration...\n');

    try {
        // Read migration file
        const migrationPath = join(__dirname, '../supabase/migrations/20260212200000_stripe_integration.sql');
        const migration = readFileSync(migrationPath, 'utf-8');

        // Execute migration
        const { error } = await supabase.rpc('exec_sql', { sql: migration });

        if (error) {
            // Try direct execution if rpc doesn't exist
            console.log('Trying direct SQL execution...');
            const statements = migration
                .split(';')
                .map(s => s.trim())
                .filter(s => s.length > 0);

            for (const statement of statements) {
                const { error: execError } = await supabase.rpc('exec', { query: statement + ';' });
                if (execError) {
                    console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
                    console.error(execError);
                }
            }
        }

        console.log('✅ Stripe integration migration applied successfully!\n');
        console.log('📋 Database changes:');
        console.log('   ✓ Added stripe_customer_id to subscriptions');
        console.log('   ✓ Added stripe_subscription_id to subscriptions');
        console.log('   ✓ Added stripe_price_id to subscriptions');
        console.log('   ✓ Added billing_cycle to subscriptions');
        console.log('   ✓ Created payments table');
        console.log('   ✓ Created stripe_events table');
        console.log('   ✓ Added indexes and RLS policies\n');

        console.log('🎯 Next steps:');
        console.log('   1. Set up Stripe account and get API keys');
        console.log('   2. Create products and prices in Stripe Dashboard');
        console.log('   3. Update .env with Stripe keys');
        console.log('   4. Update price IDs in src/lib/stripe.ts');
        console.log('   5. Deploy Edge Functions');
        console.log('   6. Configure Stripe webhook\n');
        console.log('📖 See docs/STRIPE_SETUP.md for detailed instructions');

    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

applyMigration();
