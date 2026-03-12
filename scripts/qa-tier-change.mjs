/**
 * QA: Test Subscription Upgrade/Downgrade
 * 
 * Changes a user's subscription tier and verifies the data updates correctly.
 * Usage: node scripts/qa-tier-change.mjs <user_email> <new_tier>
 */
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    'https://rlnaylyjxjjaqzwpuhar.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const email = process.argv[2];
    const newTier = process.argv[3];

    if (!email || !newTier) {
        console.log('Usage: node scripts/qa-tier-change.mjs <email> <new_tier>');
        console.log('Tiers: free, pro, business, agency');
        process.exit(1);
    }

    // Find user profile
    const { data: profiles } = await supabase.from('profiles').select('id,email,subscription_tier').eq('email', email);
    if (!profiles?.length) {
        console.log(`No profile found for ${email}`);
        process.exit(1);
    }
    const profile = profiles[0];
    console.log(`User: ${profile.email} (uid: ${profile.id.substring(0, 8)})`);
    console.log(`Current profile.subscription_tier: ${profile.subscription_tier}`);

    // Find existing subscription
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', profile.id);

    if (subs?.length) {
        const sub = subs[0];
        console.log(`Current subscription: tier=${sub.tier}, status=${sub.status}`);

        // Update subscription tier
        const now = new Date();
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const mrrMap = { free: 0, pro: 29, business: 99, agency: 299 };

        const { error } = await supabase.from('subscriptions')
            .update({
                tier: newTier,
                mrr: mrrMap[newTier] || 0,
                updated_at: now.toISOString(),
                current_period_start: now.toISOString(),
                current_period_end: endOfMonth.toISOString(),
            })
            .eq('id', sub.id);

        if (error) {
            console.log(`Failed to update subscription: ${error.message}`);
            process.exit(1);
        }
        console.log(`Updated subscription: ${sub.tier} -> ${newTier}`);
    } else {
        // No subscription exists — try by email
        const { data: emailSubs } = await supabase.from('subscriptions').select('*').eq('email', email);
        if (emailSubs?.length) {
            const sub = emailSubs[0];
            console.log(`Found subscription by email: tier=${sub.tier}`);
            const now = new Date();
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            const mrrMap = { free: 0, pro: 29, business: 99, agency: 299 };

            const { error } = await supabase.from('subscriptions')
                .update({
                    tier: newTier,
                    user_id: profile.id,
                    mrr: mrrMap[newTier] || 0,
                    updated_at: now.toISOString(),
                    current_period_start: now.toISOString(),
                    current_period_end: endOfMonth.toISOString(),
                })
                .eq('id', sub.id);

            if (error) {
                console.log(`Failed to update subscription: ${error.message}`);
                process.exit(1);
            }
            console.log(`Updated subscription: ${sub.tier} -> ${newTier}`);
        } else {
            // Create new subscription
            const mrrMap = { free: 0, pro: 29, business: 99, agency: 299 };
            const { error } = await supabase.from('subscriptions').insert({
                user_id: profile.id,
                email: profile.email,
                full_name: profile.full_name || 'Test User',
                tier: newTier,
                status: 'active',
                billing_cycle: 'monthly',
                mrr: mrrMap[newTier] || 0,
            });
            if (error) {
                console.log(`Failed to create subscription: ${error.message}`);
                process.exit(1);
            }
            console.log(`Created new subscription: ${newTier}`);
        }
    }

    // Update profile.subscription_tier
    const { error: pErr } = await supabase.from('profiles')
        .update({ subscription_tier: newTier })
        .eq('id', profile.id);
    if (pErr) {
        console.log(`Failed to update profile tier: ${pErr.message}`);
    } else {
        console.log(`Updated profile.subscription_tier: ${profile.subscription_tier} -> ${newTier}`);
    }

    // Verify
    const { data: verify } = await supabase.from('subscriptions').select('tier,status,current_period_start,current_period_end').eq('user_id', profile.id);
    console.log(`\nVerification:`);
    console.log(JSON.stringify(verify?.[0], null, 2));

    console.log('\nDone. Refresh the browser to see changes.');
}

main().catch(err => { console.error('FATAL:', err); process.exit(1); });
