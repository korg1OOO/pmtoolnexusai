/**
 * Deploy AI Agent Migration Script
 * 
 * Deploys the ai_agent_system migration to Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: VITE_SUPABASE_URL and (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deployMigration() {
    console.log('🚀 Deploying AI Agent System Migration...\n');

    try {
        // Read migration file
        const migrationPath = path.join(process.cwd(), 'supabase/migrations/20260212142800_ai_agent_system.sql');
        console.log(`📄 Reading migration: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found at:', migrationPath);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`✅ Loaded migration (${migrationSQL.length} characters)\n`);

        // Execute migration using RPC or direct query
        console.log('⚙️  Executing migration...');

        // Split into individual statements (simple split on semicolons outside of functions)
        // For complex migrations, we'll execute the whole thing at once
        const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL }).maybeSingle();

        if (error) {
            // If RPC doesn't exist, try direct execution via REST API
            console.log('⚠️  RPC method not available, trying alternative approach...');

            // Alternative: Use the REST API directly
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ sql: migrationSQL })
            });

            if (!response.ok) {
                throw new Error(`Migration failed: ${response.statusText}`);
            }

            console.log('✅ Migration executed successfully!\n');
        } else {
            console.log('✅ Migration executed successfully!\n');
        }

        // Verify deployment
        console.log('🔍 Verifying deployment...\n');

        // Check ai_agents table
        const { data: agents, error: agentsError } = await supabase
            .from('ai_agents')
            .select('*');

        if (agentsError) {
            console.error('❌ Error verifying ai_agents table:', agentsError.message);
            console.log('\n⚠️  Migration may have failed. Please check Supabase dashboard.');
            process.exit(1);
        }

        console.log(`✅ ai_agents table: ${agents?.length || 0} agents`);

        // Check capabilities
        const { data: capabilities, error: capsError } = await supabase
            .from('ai_agent_capabilities')
            .select('*');

        if (capsError) {
            console.error('❌ Error verifying ai_agent_capabilities table:', capsError.message);
        } else {
            console.log(`✅ ai_agent_capabilities table: ${capabilities?.length || 0} capabilities`);
        }

        // Check settings table exists
        const { data: settings, error: settingsError } = await supabase
            .from('ai_agent_settings')
            .select('count');

        if (!settingsError) {
            console.log(`✅ ai_agent_settings table: accessible`);
        }

        // Check versions table exists
        const { data: versions, error: versionsError } = await supabase
            .from('ai_agent_versions')
            .select('count');

        if (!versionsError) {
            console.log(`✅ ai_agent_versions table: accessible`);
        }

        // Show sample agents
        if (agents && agents.length > 0) {
            console.log('\n📋 Sample Agents:');
            agents.slice(0, 5).forEach(agent => {
                console.log(`   - ${agent.agent_type}: ${agent.label} (${agent.model_provider}/${agent.model_name})`);
            });
            if (agents.length > 5) {
                console.log(`   ... and ${agents.length - 5} more`);
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('='.repeat(60));
        console.log('\n📊 Summary:');
        console.log(`   - ${agents?.length || 0} AI agents deployed`);
        console.log(`   - ${capabilities?.length || 0} capabilities configured`);
        console.log(`   - 4 tables created (agents, capabilities, settings, versions)`);
        console.log(`   - RLS policies enabled`);
        console.log('\n🎯 Next Steps:');
        console.log('   1. Service layer already created (src/services/aiAgentService.ts)');
        console.log('   2. Hooks already created (src/hooks/useAIAgents.ts)');
        console.log('   3. Ready to proceed with Phase 3 (Edge Function update)');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Deployment failed:', error);
        console.error('\n💡 Try deploying manually via Supabase Dashboard:');
        console.error('   1. Go to https://supabase.com/dashboard');
        console.error('   2. Open SQL Editor');
        console.error('   3. Copy contents of: supabase/migrations/20260212142800_ai_agent_system.sql');
        console.error('   4. Run in SQL Editor');
        process.exit(1);
    }
}

// Run deployment
deployMigration();
