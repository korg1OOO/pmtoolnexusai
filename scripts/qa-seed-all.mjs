/**
 * QA Gap Closure: Comprehensive Data Seeding
 * 
 * Fixes ALL data gaps:
 * 1. Links subscriptions.user_id to profiles by matching email
 * 2. Seeds project_members with owner/admin/manager/member/viewer on the main test project
 * 3. Seeds subscription_features table
 * 4. Updates profiles.subscription_tier to match actual subscription tier
 * 5. Produces a test-users reference file
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

const out = [];
function log(msg) { out.push(msg); console.log(msg); }

async function main() {
    log('=== QA Gap Closure: Comprehensive Seeding ===\n');

    // ─── Load all data ────────────────────────────────────
    const { data: profiles } = await supabase.from('profiles').select('*');
    const { data: subs } = await supabase.from('subscriptions').select('*');
    const { data: projects } = await supabase.from('projects').select('id,name').limit(10);
    const { data: projMembers } = await supabase.from('project_members').select('*');

    log(`Profiles: ${profiles?.length || 0}`);
    log(`Subscriptions: ${subs?.length || 0}`);
    log(`Projects: ${projects?.length || 0}`);
    log(`Project Members: ${projMembers?.length || 0}`);

    // Build email map from profiles
    const emailToProfile = {};
    (profiles || []).forEach(p => { if (p.email) emailToProfile[p.email.toLowerCase()] = p; });

    // ─── Step 1: Link subscriptions to profiles by email ──────────
    log('\n--- Step 1: Link subscriptions.user_id to profiles ---');
    let linkedCount = 0;
    for (const sub of (subs || [])) {
        if (sub.user_id) continue; // already linked
        if (!sub.email) continue;

        const profile = emailToProfile[sub.email.toLowerCase()];
        if (profile) {
            const { error } = await supabase.from('subscriptions')
                .update({ user_id: profile.id })
                .eq('id', sub.id);
            if (error) {
                log(`  Failed to link ${sub.email}: ${error.message}`);
            } else {
                linkedCount++;
                log(`  Linked: ${sub.email} -> profile ${profile.id.substring(0, 8)} (tier: ${sub.tier})`);
            }
        } else {
            log(`  No profile for ${sub.email} - skipped`);
        }
    }
    log(`  Total linked: ${linkedCount}`);

    // Reload subscriptions
    const { data: subsAfter } = await supabase.from('subscriptions').select('*');

    // ─── Step 2: Build tier -> user mapping ──────────────────────
    log('\n--- Step 2: Tier-User Mapping ---');
    const tierUsers = { free: null, pro: null, business: null, agency: null };
    for (const sub of (subsAfter || [])) {
        if (sub.status === 'active' && sub.user_id && sub.tier && tierUsers[sub.tier] === null) {
            const profile = (profiles || []).find(p => p.id === sub.user_id);
            if (profile) {
                tierUsers[sub.tier] = { uid: sub.user_id, email: profile.email, name: profile.full_name, role: profile.role };
                log(`  ${sub.tier}: ${profile.email} (uid: ${sub.user_id.substring(0, 8)})`);
            }
        }
    }
    // For tiers with no user, find an unsubscribed profile and create a subscription
    for (const tier of ['free', 'pro', 'business', 'agency']) {
        if (!tierUsers[tier]) {
            const subscribedIds = new Set((subsAfter || []).filter(s => s.user_id).map(s => s.user_id));
            const unsubbed = (profiles || []).find(p => !subscribedIds.has(p.id) && p.email);
            if (unsubbed) {
                const { error } = await supabase.from('subscriptions').insert({
                    user_id: unsubbed.id,
                    email: unsubbed.email,
                    full_name: unsubbed.full_name,
                    tier: tier,
                    status: 'active',
                    billing_cycle: 'monthly',
                    mrr: tier === 'free' ? 0 : tier === 'pro' ? 29 : tier === 'business' ? 99 : 299,
                });
                if (error) {
                    log(`  ${tier}: Failed to create sub: ${error.message}`);
                } else {
                    tierUsers[tier] = { uid: unsubbed.id, email: unsubbed.email, name: unsubbed.full_name };
                    subscribedIds.add(unsubbed.id);
                    log(`  ${tier}: Created subscription for ${unsubbed.email}`);
                }
            } else {
                log(`  ${tier}: No unsubscribed profile available`);
            }
        }
    }

    // ─── Step 3: Seed project_members with all 5 roles ─────────
    log('\n--- Step 3: Seed project_members (5 roles) ---');

    // Use the first project that exists
    const targetProject = projects?.[0];
    if (!targetProject) {
        log('  ERROR: No projects found!');
    } else {
        log(`  Target project: ${targetProject.name} (${targetProject.id.substring(0, 8)})`);

        // Get existing members for this project
        const { data: existingPM } = await supabase.from('project_members')
            .select('user_id,role')
            .eq('project_id', targetProject.id);
        const existingRoles = new Set((existingPM || []).map(m => m.role));
        const existingUserIds = new Set((existingPM || []).map(m => m.user_id));

        log(`  Existing roles: ${[...existingRoles].join(', ') || 'none'}`);

        // Pick users for each role - use profiles with different profile.role values
        const rolePicks = {};
        const usedIds = new Set(existingUserIds);

        // Try to pick users that have appropriate profile.role for realism
        const profilesByRole = {};
        (profiles || []).forEach(p => {
            if (!p.email) return;
            const r = p.role || 'viewer';
            if (!profilesByRole[r]) profilesByRole[r] = [];
            profilesByRole[r].push(p);
        });

        const roleMapping = [
            { projRole: 'owner', profileRole: 'admin' },
            { projRole: 'admin', profileRole: 'admin' },
            { projRole: 'manager', profileRole: 'manager' },
            { projRole: 'member', profileRole: 'member' },
            { projRole: 'viewer', profileRole: 'viewer' },
        ];

        for (const { projRole, profileRole } of roleMapping) {
            if (existingRoles.has(projRole)) {
                log(`  ${projRole}: already exists (skipping)`);
                continue;
            }
            // Find a profile with matching role that isn't already used
            const candidates = (profilesByRole[profileRole] || []).filter(p => !usedIds.has(p.id));
            if (candidates.length === 0) {
                // Fallback: any unused profile
                const fallback = (profiles || []).filter(p => p.email && !usedIds.has(p.id));
                if (fallback.length === 0) {
                    log(`  ${projRole}: No available profile`);
                    continue;
                }
                candidates.push(fallback[0]);
            }
            const pick = candidates[0];
            usedIds.add(pick.id);
            rolePicks[projRole] = pick;

            const { error } = await supabase.from('project_members').insert({
                project_id: targetProject.id,
                user_id: pick.id,
                role: projRole,
            });
            if (error) {
                log(`  ${projRole}: Failed (${error.message})`);
            } else {
                log(`  ${projRole}: Added ${pick.email} (${pick.id.substring(0, 8)})`);
            }
        }
    }

    // ─── Step 4: Update profiles.subscription_tier ─────────────
    log('\n--- Step 4: Sync profiles.subscription_tier ---');
    for (const sub of (subsAfter || [])) {
        if (!sub.user_id || !sub.tier) continue;
        const profile = (profiles || []).find(p => p.id === sub.user_id);
        if (profile && profile.subscription_tier !== sub.tier) {
            const { error } = await supabase.from('profiles')
                .update({ subscription_tier: sub.tier })
                .eq('id', sub.user_id);
            if (error) {
                log(`  Failed to update ${profile.email}: ${error.message}`);
            } else {
                log(`  Updated ${profile.email}: ${profile.subscription_tier || 'null'} -> ${sub.tier}`);
            }
        }
    }

    // ─── Step 5: Seed subscription_features ──────────────────
    log('\n--- Step 5: Seed subscription_features ---');
    const features = [
        { key: 'project_limit', name: 'Project Limit', category: 'limits', free_value: '1', pro_value: '10', business_value: '50', agency_value: 'unlimited' },
        { key: 'team_members', name: 'Team Member Limit', category: 'limits', free_value: '3', pro_value: '10', business_value: '50', agency_value: 'unlimited' },
        { key: 'ai_chat', name: 'AI Chat', category: 'features', free_value: 'false', pro_value: 'true', business_value: 'true', agency_value: 'true' },
        { key: 'advanced_analytics', name: 'Advanced Analytics', category: 'features', free_value: 'false', pro_value: 'true', business_value: 'true', agency_value: 'true' },
        { key: 'portfolio_management', name: 'Portfolio Management', category: 'features', free_value: 'false', pro_value: 'false', business_value: 'true', agency_value: 'true' },
        { key: 'program_management', name: 'Program Management', category: 'features', free_value: 'false', pro_value: 'false', business_value: 'true', agency_value: 'true' },
        { key: 'financials', name: 'Financial Management', category: 'features', free_value: 'false', pro_value: 'true', business_value: 'true', agency_value: 'true' },
        { key: 'evm', name: 'Earned Value Management', category: 'features', free_value: 'false', pro_value: 'true', business_value: 'true', agency_value: 'true' },
    ];

    for (const feat of features) {
        const { error } = await supabase.from('subscription_features').upsert(feat, { onConflict: 'key' });
        if (error) {
            log(`  ${feat.key}: ${error.message}`);
        } else {
            log(`  ${feat.key}: OK`);
        }
    }

    // ─── Step 6: Produce final test reference ────────────────
    log('\n--- Step 6: Final Test User Reference ---');

    // Reload project members
    const { data: finalPM } = await supabase.from('project_members')
        .select('user_id,role')
        .eq('project_id', targetProject?.id);

    const testRef = { project: targetProject, users: {} };
    for (const pm of (finalPM || [])) {
        const profile = (profiles || []).find(p => p.id === pm.user_id);
        const sub = (subsAfter || []).find(s => s.user_id === pm.user_id);
        testRef.users[pm.role] = {
            uid: pm.user_id,
            email: profile?.email,
            name: profile?.full_name,
            tier: sub?.tier || 'none',
        };
        log(`  ${pm.role}: ${profile?.email || 'unknown'} (tier: ${sub?.tier || 'none'})`);
    }

    testRef.tierUsers = tierUsers;
    testRef.password = 'password123';

    fs.writeFileSync('scripts/qa-test-ref.json', JSON.stringify(testRef, null, 2), 'utf8');
    log('\n  Reference saved to scripts/qa-test-ref.json');
    log('\n=== SEEDING COMPLETE ===');

    fs.writeFileSync('scripts/qa-seed-report.txt', out.join('\n'), 'utf8');
}

main().catch(err => {
    console.error('FATAL:', err);
    process.exit(1);
});
