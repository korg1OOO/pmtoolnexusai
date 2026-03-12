import dotenv from 'dotenv';
dotenv.config();
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const supabase = createClient('https://rlnaylyjxjjaqzwpuhar.supabase.co', process.env.SUPABASE_SERVICE_ROLE_KEY);

async function q(label, promise) {
    const { data, error } = await promise;
    if (error) { console.log(`❌ ${label}: ${error.message}`); return null; }
    console.log(`✅ ${label}: ${Array.isArray(data) ? data.length + ' rows' : 'ok'}`);
    return data;
}

async function main() {
    console.log('=== DB State Query ===\n');

    const profiles = await q('profiles', supabase.from('profiles').select('id,full_name,platform_role,project_role').limit(100));
    const subs = await q('subscriptions', supabase.from('subscriptions').select('id,user_id,tier,status'));
    const plans = await q('plans', supabase.from('subscription_plans').select('id,name,tier,price,max_projects,max_members'));
    const ws = await q('workspaces', supabase.from('workspaces').select('id,name,tenant_id').limit(1));
    const prg = await q('programs', supabase.from('programs').select('id,name').limit(1));
    const ten = await q('tenants', supabase.from('tenants').select('id,name').limit(1));
    const wsm = await q('workspace_members', supabase.from('workspace_members').select('user_id,role'));
    const pm = await q('program_members', supabase.from('program_members').select('user_id,role'));
    const tm = await q('user_tenants', supabase.from('user_tenants').select('user_id,role'));

    if (!profiles) return;

    // Build lookups
    const subsByUser = {};
    (subs || []).forEach(s => { subsByUser[s.user_id] = s; });

    // Test users
    const testUsers = profiles.filter(p => p.full_name?.includes('User') && p.full_name?.includes('Name'));
    console.log('\n=== Test Users ===');
    for (const u of testUsers) {
        const sub = subsByUser[u.id];
        console.log(`  ${u.full_name} | plat=${u.platform_role} | proj=${u.project_role} | tier=${sub?.tier || 'none'} | id=${u.id.substring(0, 8)}`);
    }

    // Role counts
    const platCounts = {};
    const projCounts = {};
    profiles.forEach(p => {
        platCounts[p.platform_role || 'null'] = (platCounts[p.platform_role || 'null'] || 0) + 1;
        projCounts[p.project_role || 'null'] = (projCounts[p.project_role || 'null'] || 0) + 1;
    });
    console.log('\n=== Role Distribution ===');
    console.log('Platform:', JSON.stringify(platCounts));
    console.log('Project:', JSON.stringify(projCounts));

    // Plans detail
    console.log('\n=== Subscription Plans ===');
    for (const p of (plans || [])) {
        console.log(`  ${p.name} | ${p.tier} | $${p.price}/mo | proj=${p.max_projects} | mem=${p.max_members}`);
    }

    // Tier distribution
    const tierCounts = {};
    (subs || []).forEach(s => { tierCounts[s.tier] = (tierCounts[s.tier] || 0) + 1; });
    console.log('\n=== Subscription Tier Distribution ===');
    console.log(JSON.stringify(tierCounts));

    // WS/PM/TM role distribution
    const wsRoles = {};
    (wsm || []).forEach(m => { wsRoles[m.role] = (wsRoles[m.role] || 0) + 1; });
    console.log('\n=== Memberships ===');
    console.log('WS roles:', JSON.stringify(wsRoles));

    const pmRoles = {};
    (pm || []).forEach(m => { pmRoles[m.role] = (pmRoles[m.role] || 0) + 1; });
    console.log('PM roles:', JSON.stringify(pmRoles));

    const tmRoles = {};
    (tm || []).forEach(m => { tmRoles[m.role] = (tmRoles[m.role] || 0) + 1; });
    console.log('TM roles:', JSON.stringify(tmRoles));

    // ─── NOW: Fix roles for test users ───────────────────────────────────
    console.log('\n=== Fixing Test User Roles ===');

    // We need these role combos:
    // 1. project_role=admin + tier=business (for admin testing)
    // 2. project_role=manager + tier=pro (for manager testing)
    // 3. project_role=member + tier=pro (for member testing)
    // 4. project_role=viewer + tier=free (for viewer testing)
    // 5. platform_role=super_admin + tier=agency (for platform admin testing)

    const needed = [
        { project_role: 'admin', platform_role: 'admin', tier: 'business', label: 'admin' },
        { project_role: 'manager', platform_role: 'member', tier: 'pro', label: 'manager' },
        { project_role: 'member', platform_role: 'member', tier: 'pro', label: 'member' },
        { project_role: 'viewer', platform_role: 'member', tier: 'free', label: 'viewer' },
        { project_role: 'admin', platform_role: 'super_admin', tier: 'agency', label: 'super_admin' },
    ];

    const assigned = {};
    const usedIds = new Set();

    for (const n of needed) {
        // First check if a test user already matches exactly
        let match = testUsers.find(u =>
            !usedIds.has(u.id) &&
            u.project_role === n.project_role &&
            u.platform_role === n.platform_role &&
            subsByUser[u.id]?.tier === n.tier
        );

        if (!match) {
            // Find any test user not yet assigned
            match = testUsers.find(u => !usedIds.has(u.id));
        }

        if (!match) {
            // Create new user
            console.log(`  Creating new user for ${n.label}...`);
            const email = `qa_${n.label}_${Date.now()}@example.com`;
            const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
                email, password: 'password123', email_confirm: true,
                user_metadata: { full_name: `QA ${n.label} User` },
            });
            if (authErr) {
                console.log(`  ❌ Create failed: ${authErr.message}`);
                continue;
            }
            match = { id: authData.user.id, full_name: `QA ${n.label} User` };
            console.log(`  ✅ Created: ${email}`);
        }

        usedIds.add(match.id);

        // Update profile roles
        const { error: upErr } = await supabase.from('profiles').update({
            platform_role: n.platform_role,
            project_role: n.project_role,
        }).eq('id', match.id);
        if (upErr) console.log(`  ❌ Profile update for ${n.label}: ${upErr.message}`);

        // Fix subscription tier
        const existingSub = subsByUser[match.id];
        if (existingSub) {
            if (existingSub.tier !== n.tier) {
                const { error: subErr } = await supabase.from('subscriptions').update({ tier: n.tier }).eq('id', existingSub.id);
                if (subErr) console.log(`  ❌ Sub update for ${n.label}: ${subErr.message}`);
                else console.log(`  ✅ ${n.label}: Updated tier to ${n.tier}`);
            } else {
                console.log(`  ✅ ${n.label}: Tier already ${n.tier}`);
            }
        } else {
            const plan = (plans || []).find(p => p.tier === n.tier);
            if (plan) {
                const { error: insErr } = await supabase.from('subscriptions').insert({
                    user_id: match.id, tier: n.tier, status: 'active',
                    plan_id: plan.id, billing_cycle: 'monthly',
                });
                if (insErr) console.log(`  ❌ Sub create for ${n.label}: ${insErr.message}`);
                else console.log(`  ✅ ${n.label}: Created sub at ${n.tier}`);
            }
        }

        // Ensure workspace membership
        const isWsMember = (wsm || []).some(m => m.user_id === match.id);
        if (!isWsMember && ws?.[0]) {
            const wsRole = n.project_role === 'viewer' ? 'viewer' : n.project_role;
            const { error: wsErr } = await supabase.from('workspace_members').insert({
                workspace_id: ws[0].id, user_id: match.id,
                tenant_id: ws[0].tenant_id, role: wsRole, is_active: true,
            });
            if (wsErr) console.log(`  ❌ WS member ${n.label}: ${wsErr.message}`);
            else console.log(`  ✅ WS member ${n.label}: role=${wsRole}`);
        }

        // Ensure program membership
        const isPmMember = (pm || []).some(m => m.user_id === match.id);
        if (!isPmMember && prg?.[0]) {
            const pmRole = n.project_role === 'admin' ? 'manager' :
                n.project_role === 'manager' ? 'lead' :
                    n.project_role === 'viewer' ? 'viewer' : 'member';
            const { error: pmErr } = await supabase.from('program_members').insert({
                program_id: prg[0].id, user_id: match.id,
                tenant_id: ten?.[0]?.id, role: pmRole, is_active: true,
            });
            if (pmErr) console.log(`  ❌ PM member ${n.label}: ${pmErr.message}`);
            else console.log(`  ✅ PM member ${n.label}: role=${pmRole}`);
        }

        // Ensure tenant membership
        const isTmMember = (tm || []).some(m => m.user_id === match.id);
        if (!isTmMember && ten?.[0]) {
            const tRole = n.platform_role === 'super_admin' || n.platform_role === 'admin' ? 'admin' : 'member';
            const { error: tmErr } = await supabase.from('user_tenants').insert({
                user_id: match.id, tenant_id: ten[0].id, role: tRole,
            });
            if (tmErr) console.log(`  ❌ TM member ${n.label}: ${tmErr.message}`);
            else console.log(`  ✅ TM member ${n.label}: role=${tRole}`);
        }

        // Get email from auth
        const { data: authUser } = await supabase.auth.admin.getUserById(match.id);
        assigned[n.label] = {
            userId: match.id,
            email: authUser?.user?.email || match.full_name,
            name: match.full_name,
            ...n,
        };
        console.log(`  ✅ ${n.label}: ${assigned[n.label].email} ready`);
    }

    // Save reference
    const ref = {
        timestamp: new Date().toISOString(),
        password: 'password123',
        users: assigned,
        workspace: ws?.[0],
        program: prg?.[0],
        tenant: ten?.[0],
    };
    fs.writeFileSync('scripts/qa-role-users.json', JSON.stringify(ref, null, 2));

    console.log('\n=== Final User Reference ===');
    for (const [label, user] of Object.entries(assigned)) {
        console.log(`  ${label}: ${user.email} | proj=${user.project_role} | plat=${user.platform_role} | tier=${user.tier}`);
    }
    console.log('\nPassword for all: password123');
    console.log('\n=== DONE ===');
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
