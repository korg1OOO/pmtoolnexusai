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

    // 1. Get all profiles with all relevant columns
    const { data: profiles, error: pErr } = await s.from('profiles').select('*').limit(10);
    result.profileColumns = profiles && profiles.length > 0 ? Object.keys(profiles[0]) : [];
    result.sampleProfile = profiles?.[0] || null;
    result.profileError = pErr?.message || null;

    // 2. Get subscriptions with full detail
    const { data: subs, error: sErr } = await s.from('subscriptions').select('*').limit(10);
    result.subColumns = subs && subs.length > 0 ? Object.keys(subs[0]) : [];
    result.sampleSub = subs?.[0] || null;
    result.subsCount = subs?.length || 0;
    result.subsError = sErr?.message || null;

    // 3. Get project_members for a specific project  
    const { data: allProj } = await s.from('projects').select('id,name').limit(1);
    if (allProj?.[0]) {
        const pid = allProj[0].id;
        const { data: pm, error: pmErr } = await s.from('project_members').select('*').eq('project_id', pid);
        result.projectMembersForProject = { project: allProj[0].name, id: pid, members: pm, error: pmErr?.message || null };
    }

    // 4. Get all project_members (no project filter)
    const { data: allPM } = await s.from('project_members').select('*').limit(20);
    result.allProjectMembers = allPM?.map(m => ({ user_id: m.user_id?.substring(0, 8), role: m.role, project_id: m.project_id?.substring(0, 8) })) || [];
    result.allProjectMembersCount = allPM?.length || 0;

    // 5. Check all profiles that have auth accounts (with email)  
    const { data: authProfiles } = await s.from('profiles').select('id,email,full_name,role,platform_role').not('email', 'is', null).limit(20);
    result.profilesWithEmail = authProfiles?.map(p => ({
        email: p.email,
        name: p.full_name,
        role: p.role,
        platform_role: p.platform_role,
        id: p.id.substring(0, 8)
    })) || [];

    fs.writeFileSync('scripts/qa-details.json', JSON.stringify(result, null, 2), 'utf8');
    console.log('Done');
}

main().catch(console.error);
