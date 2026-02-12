/**
 * Verification Script for AI Agent System Migration
 * 
 * This script verifies that the AI agent database migration was successful
 * and all 11 agents were seeded correctly.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

interface AIAgent {
    id: string;
    agent_type: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    system_prompt: string;
    model_provider: string;
    model_name: string;
    is_active: boolean;
    version: number;
    created_at: string;
}

interface AIAgentCapability {
    id: string;
    agent_id: string;
    capability_key: string;
    description: string;
    requires_role: string[];
}

async function verifyAIAgentSystem() {
    console.log('🔍 Verifying AI Agent System Migration...\n');

    let allTestsPassed = true;

    // Test 1: Check if ai_agents table exists and has data
    console.log('Test 1: Checking ai_agents table...');
    const { data: agents, error: agentsError } = await supabase
        .from('ai_agents')
        .select('*')
        .order('agent_type');

    if (agentsError) {
        console.error('❌ Error querying ai_agents:', agentsError.message);
        allTestsPassed = false;
    } else {
        const expectedAgents = 11;
        if (agents.length === expectedAgents) {
            console.log(`✅ Found ${agents.length} agents (expected ${expectedAgents})`);
        } else {
            console.error(`❌ Found ${agents.length} agents, expected ${expectedAgents}`);
            allTestsPassed = false;
        }
    }

    // Test 2: Verify each expected agent type exists
    console.log('\nTest 2: Verifying expected agent types...');
    const expectedTypes = [
        'scheduler',
        'finance',
        'risk',
        'assignment',
        'meeting',
        'document',
        'insight',
        'strategic',
        'communication',
        'system',
        'multi-agent'
    ];

    for (const agentType of expectedTypes) {
        const agent = agents?.find(a => a.agent_type === agentType);
        if (agent) {
            console.log(`✅ ${agentType}: ${agent.label} (${agent.model_provider}/${agent.model_name})`);
        } else {
            console.error(`❌ Missing agent: ${agentType}`);
            allTestsPassed = false;
        }
    }

    // Test 3: Check agent capabilities
    console.log('\nTest 3: Checking ai_agent_capabilities table...');
    const { data: capabilities, error: capabilitiesError } = await supabase
        .from('ai_agent_capabilities')
        .select('*');

    if (capabilitiesError) {
        console.error('❌ Error querying ai_agent_capabilities:', capabilitiesError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ Found ${capabilities.length} agent capabilities`);

        // Show sample capabilities
        const schedulerAgent = agents?.find(a => a.agent_type === 'scheduler');
        if (schedulerAgent) {
            const schedulerCaps = capabilities.filter(c => c.agent_id === schedulerAgent.id);
            console.log(`   Scheduler has ${schedulerCaps.length} capabilities:`);
            schedulerCaps.forEach(cap => {
                console.log(`     - ${cap.capability_key}: ${cap.description}`);
            });
        }
    }

    // Test 4: Verify all agents are active by default
    console.log('\nTest 4: Checking agent active status...');
    const inactiveAgents = agents?.filter(a => !a.is_active);
    if (inactiveAgents && inactiveAgents.length === 0) {
        console.log('✅ All agents are active');
    } else {
        console.error(`❌ Found ${inactiveAgents?.length} inactive agents`);
        allTestsPassed = false;
    }

    // Test 5: Verify required fields are populated
    console.log('\nTest 5: Checking required fields...');
    let missingFieldCount = 0;
    agents?.forEach(agent => {
        if (!agent.icon) {
            console.error(`❌ Agent ${agent.agent_type} missing icon`);
            missingFieldCount++;
        }
        if (!agent.color) {
            console.error(`❌ Agent ${agent.agent_type} missing color`);
            missingFieldCount++;
        }
        if (!agent.system_prompt) {
            console.warn(`⚠️  Agent ${agent.agent_type} missing system_prompt`);
        }
    });

    if (missingFieldCount === 0) {
        console.log('✅ All required fields populated');
    } else {
        allTestsPassed = false;
    }

    // Test 6: Check ai_agent_settings table (should be empty initially)
    console.log('\nTest 6: Checking ai_agent_settings table...');
    const { data: settings, error: settingsError } = await supabase
        .from('ai_agent_settings')
        .select('*');

    if (settingsError) {
        console.error('❌ Error querying ai_agent_settings:', settingsError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ ai_agent_settings table accessible (${settings.length} settings)`);
    }

    // Test 7: Check ai_agent_versions table (should be empty initially)
    console.log('\nTest 7: Checking ai_agent_versions table...');
    const { data: versions, error: versionsError } = await supabase
        .from('ai_agent_versions')
        .select('*');

    if (versionsError) {
        console.error('❌ Error querying ai_agent_versions:', versionsError.message);
        allTestsPassed = false;
    } else {
        console.log(`✅ ai_agent_versions table accessible (${versions.length} versions)`);
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    if (allTestsPassed) {
        console.log('✅ ALL TESTS PASSED');
        console.log('✅ AI Agent System migration successful!');
        console.log('\nNext steps:');
        console.log('1. Update Supabase types: npm run update-types');
        console.log('2. Create aiAgentService.ts');
        console.log('3. Create useAIAgents hooks');
    } else {
        console.log('❌ SOME TESTS FAILED');
        console.log('Review errors above and check migration file');
    }
    console.log('='.repeat(50));

    return allTestsPassed;
}

// Run verification
verifyAIAgentSystem()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
