import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const result = {};

    const { data: profiles } = await s.from('profiles').select('id,full_name,email,role,platform_role');
    const { data: projMembers } = await s.from('project_members').select('user_id,role,project_id');
    const { data: userTenants } = await s.from('user_tenants').select('user_id,role,tenant_id');
    const { data: wsMembers } = await s.from('workspace_members').select('user_id,role,workspace_id');
    const { data: progMembers } = await s.from('program_members').select('user_id,role,program_id');
    const { data: subs } = await s.from('subscriptions').select('user_id,tier,status,current_period_start,current_period_end');
    const { data: tenants } = await s.from('tenants').select('id,name');
    const { data: workspaces } = await s.from('workspaces').select('id,name,tenant_id');
    const { data: portfolios } = await s.from('portfolios').select('id,name,workspace_id');
    const { data: programs } = await s.from('programs').select('id,name,portfolio_id');
    const { data: projects } = await s.from('projects').select('id,name').limit(5);
    const { data: features, error: fErr } = await s.from('subscription_features').select('*').limit(5);

    // Platform roles
    const platformRoles = {};
    (profiles || []).forEach(p => {
        const r = p.platform_role || 'user';
        if (!platformRoles[r]) platformRoles[r] = [];
        platformRoles[r].push(p.email);
    });
    result.platformRoles = Object.entries(platformRoles).map(([r, emails]) => ({ role: r, count: emails.length, sample: emails.slice(0, 3) }));

    // Project roles
    const projRoles = {};
    (projMembers || []).forEach(m => {
        const r = m.role || 'member';
        if (!projRoles[r]) projRoles[r] = new Set();
        projRoles[r].add(m.user_id);
    });
    result.projectRoles = Object.entries(projRoles).map(([r, uids]) => {
        const ids = [...uids];
        return {
            role: r,
            uniqueUsers: ids.length,
            sample: ids.slice(0, 3).map(id => {
                const p = (profiles || []).find(x => x.id === id);
                return p ? p.email : id.substring(0, 8);
            })
        };
    });

    // Tenant roles
    result.tenantRoles = (userTenants || []).map(ut => {
        const p = (profiles || []).find(x => x.id === ut.user_id);
        return { role: ut.role, email: p?.email || 'unknown', tenant: ut.tenant_id.substring(0, 8) };
    });

    // Workspace roles
    result.workspaceRoles = (wsMembers || []).map(m => {
        const p = (profiles || []).find(x => x.id === m.user_id);
        return { role: m.role, email: p?.email || 'unknown', workspace: m.workspace_id.substring(0, 8) };
    });

    // Program roles  
    result.programRoles = (progMembers || []).map(m => {
        const p = (profiles || []).find(x => x.id === m.user_id);
        return { role: m.role, email: p?.email || 'unknown', program: m.program_id.substring(0, 8) };
    });

    // Subscriptions by tier
    const tierGroups = {};
    (subs || []).forEach(sub => {
        const t = sub.tier || 'unknown';
        if (!tierGroups[t]) tierGroups[t] = [];
        const p = (profiles || []).find(x => x.id === sub.user_id);
        tierGroups[t].push({ email: p?.email || 'unknown', status: sub.status, uid: sub.user_id.substring(0, 8) });
    });
    result.subscriptions = tierGroups;

    // Entity IDs
    result.entities = {
        tenants: (tenants || []).map(t => ({ name: t.name, id: t.id })),
        workspaces: (workspaces || []).map(w => ({ name: w.name, id: w.id })),
        portfolios: (portfolios || []).map(p => ({ name: p.name, id: p.id })),
        programs: (programs || []).map(p => ({ name: p.name, id: p.id })),
        projects: (projects || []).map(p => ({ name: p.name, id: p.id }))
    };

    // Recommended test users per project role
    result.testUsers = {};
    for (const role of ['owner', 'admin', 'manager', 'member', 'viewer']) {
        const uids = projRoles[role] ? [...projRoles[role]] : [];
        if (uids.length > 0) {
            const uid = uids[0];
            const p = (profiles || []).find(x => x.id === uid);
            const sub = (subs || []).find(x => x.user_id === uid);
            result.testUsers[role] = { email: p?.email, tier: sub?.tier || 'none', uid: uid.substring(0, 8) };
        } else {
            result.testUsers[role] = null;
        }
    }

    result.subscriptionFeaturesCount = fErr ? `Error: ${fErr.message}` : (features || []).length;

    fs.writeFileSync('scripts/qa-inventory.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Done');
}

main().catch(console.error);
