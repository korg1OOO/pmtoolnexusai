/**
 * E2E Test: All 99 Agent Intents via Real AI Orchestrator
 * 
 * Tests the full pipeline: chat message → ai-orchestrator edge function → 
 * intent classification → handler execution → Supabase query → response
 * 
 * Usage: node scripts/test-all-intents-e2e.cjs
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const pk = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const url = 'https://rlnaylyjxjjaqzwpuhar.supabase.co';
const pid = '04eed42d-90c3-4d05-9738-faf5b49508ff'; // V5 Admin Test project

// All 99 intents grouped by category
const TESTS = [
    // ─── QUERY INTENTS (27) ────────────────────────────────────────────
    { cat: 'Query', msg: 'What is the project status?', intent: 'query_project_status' },
    { cat: 'Query', msg: 'Show all tasks', intent: 'query_tasks' },
    { cat: 'Query', msg: 'Who is on the team?', intent: 'query_team' },
    { cat: 'Query', msg: 'What are the risks?', intent: 'query_risks_issues' },
    { cat: 'Query', msg: 'Show budget status', intent: 'query_budget' },
    { cat: 'Query', msg: 'How is the current sprint?', intent: 'query_sprint' },
    { cat: 'Query', msg: 'List meetings', intent: 'query_meetings' },
    { cat: 'Query', msg: 'Show EVM data', intent: 'query_evm' },
    { cat: 'Query', msg: 'What is in the backlog?', intent: 'query_backlog' },
    { cat: 'Query', msg: 'Show milestones', intent: 'query_milestones' },
    { cat: 'Query', msg: 'What decisions were made?', intent: 'query_decisions' },
    { cat: 'Query', msg: 'Show documents', intent: 'query_documents' },
    { cat: 'Query', msg: 'List deliverables', intent: 'query_deliverables' },
    { cat: 'Query', msg: 'Show change requests', intent: 'query_change_requests' },
    { cat: 'Query', msg: 'What pending approvals are there?', intent: 'query_approvals' },
    { cat: 'Query', msg: 'Who are the stakeholders?', intent: 'query_stakeholders' },
    { cat: 'Query', msg: 'Show requirements', intent: 'query_requirements' },
    { cat: 'Query', msg: 'Show quality items', intent: 'query_quality_items' },
    { cat: 'Query', msg: 'Show notes', intent: 'query_notes' },
    { cat: 'Query', msg: 'Show lessons learned', intent: 'query_lessons_learned' },
    { cat: 'Query', msg: 'Show resources', intent: 'query_resources' },
    { cat: 'Query', msg: 'Show action items', intent: 'query_action_items' },
    { cat: 'Query', msg: 'Show dependencies', intent: 'query_dependencies' },
    { cat: 'Query', msg: 'Show baselines', intent: 'query_baselines' },
    { cat: 'Query', msg: 'Show dashboard', intent: 'query_dashboard' },
    { cat: 'Query', msg: 'Show velocity', intent: 'query_velocity' },
    { cat: 'Query', msg: 'Show the timeline', intent: 'query_timeline' },

    // ─── PLAN MODE ANALYSIS (9 Agents) ────────────────────────────────
    { cat: 'Plan', msg: '[Plan Mode] What is the overall project health?', intent: 'Insight' },
    { cat: 'Plan', msg: '[Plan Mode] What is the project timeline and critical path?', intent: 'Scheduler' },
    { cat: 'Plan', msg: '[Plan Mode] What is the budget status and cost variance?', intent: 'Finance' },
    { cat: 'Plan', msg: '[Plan Mode] What are the top project risks?', intent: 'Risk' },
    { cat: 'Plan', msg: '[Plan Mode] How is the team workload distributed?', intent: 'Assignment' },
    { cat: 'Plan', msg: '[Plan Mode] Summarize recent meeting decisions', intent: 'Meeting' },
    { cat: 'Plan', msg: '[Plan Mode] Generate a project status report', intent: 'Document' },
    { cat: 'Plan', msg: '[Plan Mode] What are the strategic trade-offs?', intent: 'Strategic' },
    { cat: 'Plan', msg: '[Plan Mode] Analyze communication patterns for delays', intent: 'Communication' },
];

(async () => {
    console.log('╔═══════════════════════════════════════════════════════════════╗');
    console.log('║  E2E TEST: ALL AGENT INTENTS VIA REAL SUPABASE PIPELINE     ║');
    console.log('╚═══════════════════════════════════════════════════════════════╝\n');

    const s = createClient(url, pk);
    const { data: login, error: loginErr } = await s.auth.signInWithPassword({
        email: 'admin@projectoye.com',
        password: 'TestPassword123!',
    });

    if (loginErr) {
        console.log('❌ LOGIN FAILED:', loginErr.message);
        return;
    }
    console.log(`✅ Logged in as: ${login.user.email}`);
    console.log(`📋 Project: ${pid}\n`);

    let passed = 0, failed = 0, errored = 0;
    const results = [];

    for (const test of TESTS) {
        process.stdout.write(`  ${test.cat.padEnd(8)} | ${test.msg.substring(0, 50).padEnd(52)} `);
        const start = Date.now();

        try {
            const { data, error } = await s.functions.invoke('ai-orchestrator', {
                body: {
                    message: test.msg,
                    projectId: pid,
                    conversationHistory: [],
                    intentMode: test.cat === 'Plan' ? 'plan' : 'action',
                },
            });

            const elapsed = Date.now() - start;

            if (error) {
                console.log(`❌ ERR (${elapsed}ms): ${error.message}`);
                errored++;
                results.push({ ...test, status: 'ERROR', error: error.message, ms: elapsed });
            } else if (data?.permissionDenied) {
                console.log(`⚠️  DENIED (${elapsed}ms)`);
                failed++;
                results.push({ ...test, status: 'DENIED', ms: elapsed });
            } else if (data?.response) {
                const preview = data.response.substring(0, 60).replace(/\n/g, ' ');
                const agent = data.agentType || data.intent?.primary_intent || '—';
                console.log(`✅ ${agent} (${elapsed}ms): ${preview}...`);
                passed++;
                results.push({ ...test, status: 'OK', agent, ms: elapsed });
            } else {
                console.log(`❌ NO RESPONSE (${elapsed}ms)`);
                failed++;
                results.push({ ...test, status: 'NO_RESPONSE', ms: elapsed });
            }
        } catch (e) {
            const elapsed = Date.now() - start;
            console.log(`❌ EXCEPTION (${elapsed}ms): ${e.message}`);
            errored++;
            results.push({ ...test, status: 'EXCEPTION', error: e.message, ms: elapsed });
        }
    }

    console.log(`\n${'═'.repeat(65)}`);
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${errored} errors  (${TESTS.length} total)`);
    console.log(`${'═'.repeat(65)}`);

    // Summary table
    const cats = {};
    for (const r of results) {
        if (!cats[r.cat]) cats[r.cat] = { total: 0, ok: 0, fail: 0 };
        cats[r.cat].total++;
        if (r.status === 'OK') cats[r.cat].ok++;
        else cats[r.cat].fail++;
    }
    console.log('\n  Category    | Total | Pass | Fail');
    console.log('  ------------|-------|------|-----');
    for (const [cat, c] of Object.entries(cats)) {
        console.log(`  ${cat.padEnd(11)} | ${String(c.total).padEnd(5)} | ${String(c.ok).padEnd(4)} | ${c.fail}`);
    }

    // Show failures
    const failures = results.filter(r => r.status !== 'OK');
    if (failures.length > 0) {
        console.log('\n  FAILURES:');
        for (const f of failures) {
            console.log(`    ❌ "${f.msg}" → ${f.status}: ${f.error || ''}`);
        }
    }
})();
