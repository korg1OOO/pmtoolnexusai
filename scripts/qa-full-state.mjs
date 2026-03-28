import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const out = [];

    // 1. Profiles by role
    const { data: profiles } = await s.from('profiles').select('id,full_name,role,email');
    const roleGroups = {};
    (profiles || []).forEach(p => {
        const r = p.role || '(none)';
        roleGroups[r] = roleGroups[r] || [];
        roleGroups[r].push({ email: p.email, id: p.id, name: p.full_name });
    });
    out.push('=== PROFILES BY ROLE ===');
    Object.entries(roleGroups).forEach(([role, users]) => {
        out.push(`\n${role} (${users.length}):`);
        users.forEach(u => out.push(`  ${u.email} | ${u.name || '(no name)'} | ${u.id.substring(0, 8)}`));
    });

    // 2. Subscription plans
    const { data: plans } = await s.from('subscription_plans').select('*');
    out.push('\n\n=== SUBSCRIPTION PLANS ===');
    (plans || []).forEach(p => {
        out.push(`  ${p.tier}: $${p.price_monthly}/mo $${p.price_annual}/yr active=${p.active} id=${p.id.substring(0, 8)}`);
    });

    // 3. Subscriptions by tier + status
    const { data: subs } = await s.from('subscriptions').select('*');
    out.push('\n\n=== SUBSCRIPTIONS (tier|status count) ===');
    const tierStatus = {};
    (subs || []).forEach(sub => {
        const key = `${sub.tier}|${sub.status}`;
        tierStatus[key] = (tierStatus[key] || 0) + 1;
    });
    Object.entries(tierStatus).forEach(([k, v]) => out.push(`  ${k}: ${v}`));

    // 4. Tenants
    const { data: tenants } = await s.from('tenants').select('*');
    out.push('\n\n=== TENANTS ===');
    (tenants || []).forEach(t => {
        out.push(`  ${t.name} | plan=${t.plan || 'none'} | id=${t.id.substring(0, 8)}`);
    });

    // 5. User-tenant mappings
    const { data: userTenants } = await s.from('user_tenants').select('*');
    out.push('\n\n=== USER-TENANT MAPPINGS ===');
    out.push(`  Total: ${(userTenants || []).length}`);
    const tenantRoles = {};
    (userTenants || []).forEach(ut => {
        tenantRoles[ut.role] = (tenantRoles[ut.role] || 0) + 1;
    });
    Object.entries(tenantRoles).forEach(([r, c]) => out.push(`  role=${r}: ${c}`));

    // 6. Workspaces
    const { data: workspaces } = await s.from('workspaces').select('*');
    out.push('\n\n=== WORKSPACES ===');
    (workspaces || []).forEach(w => {
        out.push(`  ${w.name} | tenant=${w.tenant_id?.substring(0, 8)} | id=${w.id.substring(0, 8)}`);
    });

    // 7. Workspace members
    const { data: wMembers } = await s.from('workspace_members').select('*');
    out.push('\n\n=== WORKSPACE MEMBERS ===');
    out.push(`  Total: ${(wMembers || []).length}`);
    const wRoles = {};
    (wMembers || []).forEach(m => { wRoles[m.role] = (wRoles[m.role] || 0) + 1; });
    Object.entries(wRoles).forEach(([r, c]) => out.push(`  role=${r}: ${c}`));

    // 8. Portfolios
    const { data: portfolios } = await s.from('portfolios').select('*');
    out.push('\n\n=== PORTFOLIOS ===');
    (portfolios || []).forEach(p => {
        out.push(`  ${p.name} | workspace=${p.workspace_id?.substring(0, 8)} | id=${p.id.substring(0, 8)}`);
    });

    // 9. Programs
    const { data: programs } = await s.from('programs').select('*');
    out.push('\n\n=== PROGRAMS ===');
    (programs || []).forEach(p => {
        out.push(`  ${p.name} | portfolio=${p.portfolio_id?.substring(0, 8)} | id=${p.id.substring(0, 8)}`);
    });

    // 10. Program members
    const { data: pMembers } = await s.from('program_members').select('*');
    out.push('\n\n=== PROGRAM MEMBERS ===');
    out.push(`  Total: ${(pMembers || []).length}`);
    const pRoles = {};
    (pMembers || []).forEach(m => { pRoles[m.role] = (pRoles[m.role] || 0) + 1; });
    Object.entries(pRoles).forEach(([r, c]) => out.push(`  role=${r}: ${c}`));

    // 11. Projects (first 10)
    const { data: projects } = await s.from('projects').select('id,name,status,workspace_id').limit(10);
    out.push('\n\n=== PROJECTS (first 10) ===');
    (projects || []).forEach(p => {
        out.push(`  ${p.name} | status=${p.status} | ws=${p.workspace_id?.substring(0, 8) || 'none'} | id=${p.id.substring(0, 8)}`);
    });

    // 12. AI agents summary
    const { data: agents } = await s.from('ai_agents').select('name,category,priority');
    out.push('\n\n=== AI AGENTS ===');
    out.push(`  Total: ${(agents || []).length}`);
    const agentCats = {};
    (agents || []).forEach(a => { agentCats[a.category] = (agentCats[a.category] || 0) + 1; });
    Object.entries(agentCats).forEach(([c, n]) => out.push(`  ${c}: ${n}`));

    // 13. Subscription features
    const { data: features, error: fErr } = await s.from('subscription_features').select('*');
    out.push('\n\n=== SUBSCRIPTION FEATURES ===');
    if (fErr) {
        out.push(`  Error: ${fErr.message}`);
    } else {
        out.push(`  Total: ${(features || []).length}`);
        (features || []).forEach(f => out.push(`  ${f.key}: ${f.name} | cat=${f.category}`));
    }

    const text = out.join('\n');
    fs.writeFileSync('scripts/qa-full-state.txt', text);
    console.log(text);
}

main().catch(console.error);
