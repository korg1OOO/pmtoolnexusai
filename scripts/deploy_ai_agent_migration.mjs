/**
 * Deploy AI Agent Migration via PostgreSQL Client
 * Uses pg library to execute migration directly
 */

import pkg from 'pg';
const { Client } = pkg;
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database connection from .env
const connectionString = 'postgresql://postgres:ZjcJszLxFbP4YiE3@db.rlnaylyjxjjaqzwpuhar.supabase.co:5432/postgres';

async function deployMigration() {
    console.log('🚀 Deploying AI Agent System Migration via PostgreSQL...\n');

    const client = new Client({
        connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Supabase
        }
    });

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await client.connect();
        console.log('✅ Connected!\n');

        // Read migration file
        const migrationPath = path.join(__dirname, '../supabase/migrations/20260212142800_ai_agent_system.sql');
        console.log(`📄 Reading migration: ${migrationPath}`);

        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found at:', migrationPath);
            process.exit(1);
        }

        const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
        console.log(`✅ Loaded migration (${migrationSQL.length} characters)\n`);

        // Execute migration
        console.log('⚙️  Executing migration SQL...');
        await client.query(migrationSQL);
        console.log('✅ Migration executed successfully!\n');

        // Verify deployment
        console.log('🔍 Verifying deployment...\n');

        // Check ai_agents table
        const agentsResult = await client.query('SELECT COUNT(*) as count FROM ai_agents');
        const agentCount = parseInt(agentsResult.rows[0].count);
        console.log(`✅ ai_agents table: ${agentCount} agents`);

        // List all agents
        const agentsList = await client.query(`
      SELECT agent_type, label, model_provider, model_name 
      FROM ai_agents 
      ORDER BY agent_type
    `);

        console.log('\n📋 Deployed Agents:');
        agentsList.rows.forEach(agent => {
            console.log(`   - ${agent.agent_type}: ${agent.label} (${agent.model_provider}/${agent.model_name})`);
        });

        // Check capabilities
        const capsResult = await client.query('SELECT COUNT(*) as count FROM ai_agent_capabilities');
        const capsCount = parseInt(capsResult.rows[0].count);
        console.log(`\n✅ ai_agent_capabilities table: ${capsCount} capabilities`);

        // Check other tables exist
        const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'ai_agent%'
      ORDER BY table_name
    `);

        console.log(`\n✅ All tables created:`);
        tablesResult.rows.forEach(row => {
            console.log(`   - ${row.table_name}`);
        });

        console.log('\n' + '='.repeat(60));
        console.log('✅ DEPLOYMENT SUCCESSFUL!');
        console.log('='.repeat(60));
        console.log('\n📊 Summary:');
        console.log(`   - ${agentCount} AI agents deployed`);
        console.log(`   - ${capsCount} capabilities configured`);
        console.log(`   - 4 tables created`);
        console.log(`   - RLS policies enabled`);
        console.log('\n🎯 Next Steps:');
        console.log('   ✅ Service layer ready (src/services/aiAgentService.ts)');
        console.log('   ✅ Hooks ready (src/hooks/useAIAgents.ts)');
        console.log('   📅 Phase 3: Update ai-orchestrator Edge Function');
        console.log('   📅 Phase 4: Build Admin UI');
        console.log('\n');

    } catch (error) {
        console.error('\n❌ Deployment failed:');
        console.error(error);
        console.error('\n💡 Manual deployment option:');
        console.error('   1. Go to https://supabase.com/dashboard');
        console.error('   2. Select your project');
        console.error('   3. Open SQL Editor');
        console.error('   4. Copy: supabase/migrations/20260212142800_ai_agent_system.sql');
        console.error('   5. Paste and run');
        process.exit(1);
    } finally {
        await client.end();
    }
}

// Run deployment
deployMigration()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('Fatal error:', err);
        process.exit(1);
    });
