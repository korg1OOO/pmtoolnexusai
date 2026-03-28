/**
 * qa-seed-features.mjs
 *
 * Seeds the subscription_features table with the canonical feature set per tier,
 * and fixes the Agency plan pricing from $29/mo to $149/mo.
 *
 * Table schema: id, plan_id, feature_name, is_enabled, metadata (jsonb), created_at, updated_at
 *
 * Usage: node scripts/qa-seed-features.mjs
 * Requires SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Feature definitions by minimum tier ──────────────────────────────────────
const FEATURES = [
    // Free tier
    { name: 'basic_project_management', min_tier: 'free', meta: { display_name: 'Basic Project Management', category: 'core' } },
    { name: 'task_management', min_tier: 'free', meta: { display_name: 'Task Management', category: 'core' } },
    { name: 'basic_gantt', min_tier: 'free', meta: { display_name: 'Basic Gantt Chart', category: 'planning' } },
    { name: 'sprint_boards', min_tier: 'free', meta: { display_name: 'Sprint Boards', category: 'agile' } },
    { name: 'basic_reports', min_tier: 'free', meta: { display_name: 'Basic Reports', category: 'reporting' } },
    { name: 'team_chat', min_tier: 'free', meta: { display_name: 'Team Chat', category: 'collaboration' } },

    // Pro tier
    { name: 'advanced_financials', min_tier: 'pro', meta: { display_name: 'Financial Management', category: 'financial' } },
    { name: 'evm_analysis', min_tier: 'pro', meta: { display_name: 'Earned Value Management', category: 'financial' } },
    { name: 'scenarios', min_tier: 'pro', meta: { display_name: 'Scenario Planning', category: 'planning' } },
    { name: 'ai_credits', min_tier: 'pro', meta: { display_name: 'AI Credits', category: 'ai' } },
    { name: 'communication_intelligence', min_tier: 'pro', meta: { display_name: 'Communication Intelligence', category: 'collaboration' } },
    { name: 'collaboration_spaces', min_tier: 'pro', meta: { display_name: 'Collaboration Spaces', category: 'collaboration' } },
    { name: 'advanced_integrations', min_tier: 'pro', meta: { display_name: 'Advanced Integrations', category: 'integrations' } },
    { name: 'custom_workflows', min_tier: 'pro', meta: { display_name: 'Custom Workflows', category: 'automation' } },

    // Business tier
    { name: 'executive_dashboards', min_tier: 'business', meta: { display_name: 'Executive Dashboards', category: 'reporting' } },
    { name: 'portfolio_management', min_tier: 'business', meta: { display_name: 'Portfolio Management', category: 'governance' } },
    { name: 'program_management', min_tier: 'business', meta: { display_name: 'Program Management', category: 'governance' } },
    { name: 'traceability_matrix', min_tier: 'business', meta: { display_name: 'Traceability Matrix', category: 'governance' } },
    { name: 'requirements_management', min_tier: 'business', meta: { display_name: 'Requirements Management', category: 'governance' } },
    { name: 'quality_register', min_tier: 'business', meta: { display_name: 'Quality Register', category: 'governance' } },
    { name: 'resource_optimization', min_tier: 'business', meta: { display_name: 'Resource Optimization', category: 'resources' } },
    { name: 'sso_saml', min_tier: 'business', meta: { display_name: 'SSO / SAML', category: 'security' } },

    // Agency tier
    { name: 'white_labeling', min_tier: 'agency', meta: { display_name: 'White Labeling', category: 'branding' } },
    { name: 'unlimited_ai', min_tier: 'agency', meta: { display_name: 'Unlimited AI', category: 'ai' } },
    { name: 'api_access', min_tier: 'agency', meta: { display_name: 'API Access', category: 'integrations' } },
    { name: 'dedicated_support', min_tier: 'agency', meta: { display_name: 'Dedicated Support', category: 'support' } },
    { name: 'multi_tenant', min_tier: 'agency', meta: { display_name: 'Multi-Tenant Management', category: 'governance' } },
];

const TIER_ORDER = ['free', 'pro', 'business', 'agency'];

async function main() {
    console.log('=== Subscription Features Seeding ===\n');

    // Step 1: Get plans
    const { data: plans, error: plansErr } = await s.from('subscription_plans').select('*');
    if (plansErr) { console.error('Plans error:', plansErr.message); return; }
    console.log(`Plans: ${plans.length}`);
    plans.forEach(p => console.log(`  ${p.tier}: $${p.price}/mo`));

    // Step 2: Fix Agency pricing
    const agencyPlan = plans.find(p => p.tier === 'agency');
    if (agencyPlan && agencyPlan.price < 100) {
        const { error } = await s.from('subscription_plans').update({ price: 149 }).eq('id', agencyPlan.id);
        console.log(error ? `Agency fix failed: ${error.message}` : '\n✅ Agency price: $29 → $149');
    }

    // Step 3: Clear existing features
    const { error: delErr } = await s.from('subscription_features').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (delErr) { console.error('Delete error:', delErr.message); return; }
    console.log('\nCleared existing features');

    // Step 4: Build rows
    const rows = [];
    for (const f of FEATURES) {
        const minIdx = TIER_ORDER.indexOf(f.min_tier);
        for (let i = minIdx; i < TIER_ORDER.length; i++) {
            const plan = plans.find(p => p.tier === TIER_ORDER[i]);
            if (!plan) continue;
            rows.push({ plan_id: plan.id, feature_name: f.name, is_enabled: true, metadata: f.meta });
        }
    }

    // Step 5: Insert
    const { error: insErr } = await s.from('subscription_features').insert(rows);
    if (insErr) { console.error('Insert error:', insErr.message); return; }
    console.log(`✅ Inserted ${rows.length} feature rows`);

    // Step 6: Verify
    for (const tier of TIER_ORDER) {
        const plan = plans.find(p => p.tier === tier);
        if (!plan) continue;
        const { count } = await s.from('subscription_features').select('*', { count: 'exact', head: true }).eq('plan_id', plan.id);
        console.log(`  ${tier}: ${count} features`);
    }

    // Verify pricing
    const { data: fp } = await s.from('subscription_plans').select('tier,price').order('price');
    console.log('\nFinal pricing:');
    (fp || []).forEach(p => console.log(`  ${p.tier}: $${p.price}`));

    console.log('\nDone!');
}

main().catch(console.error);
