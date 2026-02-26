// Test all 9 Plan mode agents via direct API calls
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const pk = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const url = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const pid = '04eed42d-90c3-4d05-9738-faf5b49508ff';

// Test scenarios — each targets a different agent
const SCENARIOS = [
    { agent: 'Insight', query: 'What is the overall project health?' },
    { agent: 'Scheduler', query: 'What is the project timeline and critical path?' },
    { agent: 'Finance', query: 'What is the budget status and cost variance?' },
    { agent: 'Risk', query: 'What are the top project risks?' },
    { agent: 'Assignment', query: 'How is the team workload distributed?' },
    { agent: 'Meeting', query: 'Summarize recent meeting decisions and action items' },
    { agent: 'Document', query: 'Generate a project status report' },
    { agent: 'Strategic', query: 'What are the strategic trade-offs for this project?' },
    { agent: 'Communication', query: 'Analyze communication patterns for delay signals' },
];

(async () => {
    const s = createClient(url, pk);
    const { data: login, error: loginErr } = await s.auth.signInWithPassword({
        email: 'admin@projectoye.com',
        password: 'TestPassword123!',
    });

    if (loginErr) {
        console.log('Login error:', loginErr);
        return;
    }
    console.log('Logged in as:', login.user.email);
    console.log('');

    let passed = 0;
    let failed = 0;
    const results = [];

    for (const scenario of SCENARIOS) {
        process.stdout.write(`Testing ${scenario.agent}... `);
        const start = Date.now();

        try {
            const { data, error } = await s.functions.invoke('ai-orchestrator', {
                body: {
                    message: `[Plan Mode] ${scenario.query}`,
                    projectId: pid,
                    conversationHistory: [],
                    intentMode: 'plan',
                },
            });

            const elapsed = Date.now() - start;

            if (error) {
                console.log(`❌ ERROR (${elapsed}ms): ${error.message}`);
                failed++;
                results.push({ agent: scenario.agent, status: 'ERROR', error: error.message, ms: elapsed });
            } else if (data?.permissionDenied) {
                console.log(`⚠️  PERMISSION DENIED (${elapsed}ms) — role: ${data.intent?.primary_intent}`);
                failed++;
                results.push({ agent: scenario.agent, status: 'DENIED', intent: data.intent?.primary_intent, ms: elapsed });
            } else if (data?.response) {
                const preview = data.response.substring(0, 80).replace(/\n/g, ' ');
                const agentType = data.agentType || 'unknown';
                console.log(`✅ ${agentType} (${elapsed}ms): ${preview}...`);
                passed++;
                results.push({ agent: scenario.agent, status: 'OK', agentType, intent: data.intent?.primary_intent, ms: elapsed });
            } else {
                console.log(`❌ NO RESPONSE (${elapsed}ms)`);
                failed++;
                results.push({ agent: scenario.agent, status: 'NO_RESPONSE', ms: elapsed });
            }
        } catch (e) {
            const elapsed = Date.now() - start;
            console.log(`❌ EXCEPTION (${elapsed}ms): ${e.message}`);
            failed++;
            results.push({ agent: scenario.agent, status: 'EXCEPTION', error: e.message, ms: elapsed });
        }
    }

    console.log(`\n${'='.repeat(60)}`);
    console.log(`SUMMARY: ${passed}/${SCENARIOS.length} passed, ${failed} failed`);
    console.log(`${'='.repeat(60)}`);

    // Print table
    console.log('\nAgent           | Status | Intent              | AgentType    | Time');
    console.log('----------------|--------|---------------------|-------------|------');
    for (const r of results) {
        const agent = r.agent.padEnd(15);
        const status = r.status.padEnd(6);
        const intent = (r.intent || r.error || '').substring(0, 19).padEnd(19);
        const agentType = (r.agentType || '').padEnd(12);
        console.log(`${agent} | ${status} | ${intent} | ${agentType} | ${r.ms}ms`);
    }
})();
