import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const results = {};

    // 1. Profiles
    const { data: profiles } = await s.from('profiles').select('id,full_name,role,email');
    results.profiles = (profiles || []).map(p => ({
        id: p.id?.substring(0, 8) + '...',
        full_id: p.id,
        name: p.full_name || '(none)',
        role: p.role || '(none)',
        email: p.email || '(none)',
    }));

    // 2. User roles (project-level)
    const { data: userRoles, error: urErr } = await s.from('user_roles').select('*');
    results.user_roles = { data: userRoles, error: urErr?.message };

    // 3. Platform roles
    const { data: platformRoles, error: prErr } = await s.from('platform_roles').select('*');
    results.platform_roles = { data: platformRoles, error: prErr?.message };

    // 4. Platform user roles
    const { data: platformUserRoles, error: purErr } = await s.from('platform_user_roles').select('*');
    results.platform_user_roles = { data: platformUserRoles, error: purErr?.message };

    // 5. Platform role permissions
    const { data: platformPerms, error: ppErr } = await s.from('platform_role_permissions').select('*');
    results.platform_role_permissions = { data: platformPerms, error: ppErr?.message };

    // 6. Platform features
    const { data: platformFeatures, error: pfErr } = await s.from('platform_features').select('*');
    results.platform_features = { data: platformFeatures, error: pfErr?.message };

    // 7. Subscription plans
    const { data: plans, error: spErr } = await s.from('subscription_plans').select('*');
    results.subscription_plans = { data: plans, error: spErr?.message };

    // 8. Subscriptions (user subscriptions)
    const { data: subs, error: subErr } = await s.from('subscriptions').select('*');
    results.subscriptions = { data: subs, error: subErr?.message };

    // 9. Tenants
    const { data: tenants, error: tErr } = await s.from('tenants').select('*');
    results.tenants = { data: tenants, error: tErr?.message };

    // 10. User tenants
    const { data: userTenants, error: utErr } = await s.from('user_tenants').select('*');
    results.user_tenants = { data: userTenants, error: utErr?.message };

    // 11. AI agents
    const { data: agents, error: aErr } = await s.from('ai_agents').select('*');
    results.ai_agents = { data: agents, error: aErr?.message };

    // 12. Projects
    const { data: projects, error: pjErr } = await s.from('projects').select('id,name,status,created_at').limit(20);
    results.projects = { data: projects, error: pjErr?.message };

    const outPath = 'scripts/qa-db-state.json';
    fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
    console.log(`Written to ${outPath}`);

    // Summary
    console.log('\n=== SUMMARY ===');
    console.log(`Profiles: ${results.profiles.length}`);
    console.log(`User Roles: ${userRoles?.length || 0}`);
    console.log(`Platform Roles: ${platformRoles?.length || 0}`);
    console.log(`Platform User Roles: ${platformUserRoles?.length || 0}`);
    console.log(`Platform Features: ${platformFeatures?.length || 0}`);
    console.log(`Subscription Plans: ${plans?.length || 0}`);
    console.log(`Subscriptions: ${subs?.length || 0}`);
    console.log(`Tenants: ${tenants?.length || 0}`);
    console.log(`User Tenants: ${userTenants?.length || 0}`);
    console.log(`AI Agents: ${agents?.length || 0}`);
    console.log(`Projects: ${projects?.length || 0}`);

    // Profile roles breakdown
    const roleGroups = {};
    results.profiles.forEach(p => {
        roleGroups[p.role] = roleGroups[p.role] || [];
        roleGroups[p.role].push(p.email);
    });
    console.log('\n=== PROFILES BY ROLE ===');
    Object.entries(roleGroups).forEach(([role, emails]) => {
        console.log(`\n  ${role} (${emails.length}):`);
        emails.forEach(e => console.log(`    - ${e}`));
    });
}

main().catch(console.error);
