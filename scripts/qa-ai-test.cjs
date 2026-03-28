const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const fs = require('fs');

const supabase = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const report = [];
function log(msg) { report.push(msg); console.log(msg); }

async function main() {
    log('=== QA Phase 4: AI Plan Mode Tests ===\n');

    // Get agents
    const { data: agents } = await supabase.from('agents')
        .select('id, name, type, mode, status, priority')
        .order('priority')
        .limit(5);

    log('Top 5 agents:');
    for (const a of agents) {
        log('  ' + a.name + ' | type=' + a.type + ' | mode=' + a.mode + ' | P' + a.priority);
    }

    const url = 'https://rlnaylyjxjjaqzwpuhar.supabase.co/functions/v1/ai-orchestrator';
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
    };

    const agentId = agents[0].id;

    // Test 1: Risk analysis
    log('\n--- Test 1: Risk Analysis ---');
    const t1 = Date.now();
    try {
        const r1 = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: 'Analyze project risks',
                agentId: agentId,
                mode: 'plan',
                context: { projectId: 'test' }
            })
        });
        log('Status: ' + r1.status + ' (' + (Date.now() - t1) + 'ms)');
        const d1 = await r1.text();
        log('Response: ' + d1.substring(0, 250));
    } catch (e) {
        log('Error: ' + e.message);
    }

    // Test 2: Sprint planning
    log('\n--- Test 2: Sprint Planning ---');
    const t2 = Date.now();
    try {
        const r2 = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: 'Plan next sprint with task estimates',
                agentId: agentId,
                mode: 'plan',
                context: { projectId: 'test' }
            })
        });
        log('Status: ' + r2.status + ' (' + (Date.now() - t2) + 'ms)');
        const d2 = await r2.text();
        log('Response: ' + d2.substring(0, 250));
    } catch (e) {
        log('Error: ' + e.message);
    }

    // Test 3: Resource allocation
    log('\n--- Test 3: Resource Allocation ---');
    const t3 = Date.now();
    try {
        const r3 = await fetch(url, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: 'Suggest resource rebalancing',
                agentId: agentId,
                mode: 'plan',
                context: { projectId: 'test' }
            })
        });
        log('Status: ' + r3.status + ' (' + (Date.now() - t3) + 'ms)');
        const d3 = await r3.text();
        log('Response: ' + d3.substring(0, 250));
    } catch (e) {
        log('Error: ' + e.message);
    }

    log('\n=== DONE ===');
    fs.writeFileSync('scripts/qa-ai-test-report.txt', report.join('\n'));
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
