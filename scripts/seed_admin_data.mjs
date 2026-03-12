import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Simple mock data generator
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
const randomString = () => Math.random().toString(36).substring(7);

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env
dotenvConfig({ path: join(rootDir, '.env'), override: true });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('❌  Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
});

console.log(`🔌  Connecting to ${SUPABASE_URL}...`);

async function seedData() {
    try {
        // 1. Seed Users & Profiles
        console.log('👤  Seeding Users & Profiles...');
        const tiers = ['free', 'pro', 'business', 'agency'];
        const roles = ['admin', 'manager', 'member', 'viewer'];
        const statuses = ['active', 'inactive', 'suspended'];

        const users = [];

        // Create 20 mock users
        for (let i = 0; i < 20; i++) {
            const email = `user${i}_${Date.now()}@example.com`;
            const fullName = `User ${i} Name`; // Replace with faker if available

            // Create Auth User
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email,
                password: 'password123',
                email_confirm: true,
                user_metadata: { full_name: fullName },
            });

            let userId;

            if (authError) {
                // If user exists, try to fetch their ID
                if (authError.status === 422 || authError.message?.includes('registered')) {
                    // We can't easily get ID by email via admin API without listing all or using a different call.
                    // But we can try to proceed if we had a way.
                    // Actually, listUsers is the way.
                    const { data: listData } = await supabase.auth.admin.listUsers();
                    const existing = listData.users.find(u => u.email === email);
                    if (existing) {
                        userId = existing.id;
                        console.log(`   ℹ️  User ${email} already exists. Using ID: ${userId}`);
                    } else {
                        console.warn(`   ⚠️  Failed to create user ${email} and could not find existing:`, authError);
                        continue;
                    }
                } else {
                    console.warn(`   ⚠️  Failed to create user ${email}:`, authError);
                    continue;
                }
            } else {
                userId = authData.user.id;
            }

            users.push({ id: userId, email });

            // Upsert Profile (Trigger might handle this, but explicit update ensures data)
            const role = i === 0 ? 'admin' : randomElement(roles); // Ensure at least one admin
            const status = randomElement(statuses);

            const { error: profileError } = await supabase.from('profiles').upsert({
                id: userId,
                full_name: fullName,
                email: email,
                role: role,
                status: status,
                last_active_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            });
            if (profileError) console.warn(`   ⚠️  Profile upsert failed for ${email}:`, profileError.message);
        }
        console.log(`   ✅  Created ${users.length} users.`);


        // 1.5 Seed Subscription Plans (CRITICAL for Admin Page)
        console.log('📋  Seeding Subscription Plans...');
        const plans = [
            { tier: 'free', name: 'Free', price_monthly: 0, price_annual: 0, active: true, limits: { projects: 1, users: 1 } },
            { tier: 'pro', name: 'Pro', price_monthly: 2900, price_annual: 29000, active: true, limits: { projects: 5, users: 5 } },
            { tier: 'business', name: 'Business', price_monthly: 9900, price_annual: 99000, active: true, limits: { projects: 20, users: 20 } },
            { tier: 'agency', name: 'Agency', price_monthly: 29900, price_annual: 299000, active: true, limits: { projects: -1, users: -1 } }
        ];

        for (const plan of plans) {
            const { error } = await supabase.from('subscription_plans').upsert({
                tier: plan.tier,
                name: plan.name,
                price_monthly: plan.price_monthly,
                price_annual: plan.price_annual,
                limits: plan.limits,
                active: plan.active,
                features: {},
                created_at: new Date().toISOString()
            }, { onConflict: 'tier' });

            if (error) {
                console.error(`   ❌ Failed to seed plan ${plan.tier}:`, error.message);
            }
        }
        console.log(`   ✅  Seeded ${plans.length} plans.`);

        // 1.6 Seed Features (CRITICAL for Feature Matrix)
        console.log('✨  Seeding Features...');
        const features = [
            // CORE
            { key: 'dashboard', name: 'Dashboard', category: 'CORE', min_plan_tier: 'free', is_enabled: true, sort_order: 1 },
            { key: 'projects', name: 'Projects & Tasks', category: 'CORE', min_plan_tier: 'free', is_enabled: true, sort_order: 2 },
            { key: 'documents', name: 'Document Center', category: 'CORE', min_plan_tier: 'free', is_enabled: true, sort_order: 3 },
            { key: 'notes', name: 'Notes & Wiki', category: 'CORE', min_plan_tier: 'free', is_enabled: true, sort_order: 4 },
            { key: 'team_chat', name: 'Team Chat', category: 'CORE', min_plan_tier: 'pro', is_enabled: true, sort_order: 5 },
            { key: 'calendar', name: 'Calendar', category: 'CORE', min_plan_tier: 'free', is_enabled: true, sort_order: 6 },

            // ADVANCED
            { key: 'gantt', name: 'Gantt Charts', category: 'ADVANCED', min_plan_tier: 'pro', is_enabled: true, sort_order: 10 },
            { key: 'portfolio', name: 'Portfolio Management', category: 'ADVANCED', min_plan_tier: 'business', is_enabled: true, sort_order: 11 },
            { key: 'financials', name: 'Budget & EVM', category: 'ADVANCED', min_plan_tier: 'business', is_enabled: true, sort_order: 12 },
            { key: 'risks', name: 'Risk Management', category: 'ADVANCED', min_plan_tier: 'pro', is_enabled: true, sort_order: 13 },
            { key: 'reporting', name: 'Advanced Reporting', category: 'ADVANCED', min_plan_tier: 'business', is_enabled: true, sort_order: 14 },
            { key: 'stakeholders', name: 'Stakeholder Register', category: 'ADVANCED', min_plan_tier: 'pro', is_enabled: true, sort_order: 15 },

            // EXPERIMENTAL
            { key: 'ai_meetings', name: 'AI Meeting Assistant', category: 'EXPERIMENTAL', min_plan_tier: 'business', is_enabled: true, sort_order: 20 },
            { key: 'scenarios', name: 'Scenario Planning', category: 'EXPERIMENTAL', min_plan_tier: 'agency', is_enabled: true, sort_order: 21 },
            { key: 'morning_briefing', name: 'Morning Briefing', category: 'EXPERIMENTAL', min_plan_tier: 'pro', is_enabled: true, sort_order: 22 },
            { key: 'communication_intelligence', name: 'Comm. Intelligence', category: 'EXPERIMENTAL', min_plan_tier: 'agency', is_enabled: true, sort_order: 23 },
            { key: 'ai_credits', name: 'AI Credits System', category: 'EXPERIMENTAL', min_plan_tier: 'free', is_enabled: true, sort_order: 24 }
        ];

        for (const feat of features) {
            await supabase.from('features').upsert({
                key: feat.key,
                name: feat.name,
                category: feat.category,
                min_plan_tier: feat.min_plan_tier,
                is_enabled: feat.is_enabled,
                sort_order: feat.sort_order,
                updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
        }
        console.log(`   ✅  Seeded ${features.length} features.`);

        // 2. Seed Subscriptions
        console.log('💳  Seeding Subscriptions...');
        const subs = [];
        for (const user of users) {
            // 80% chance of having a subscription
            if (Math.random() > 0.2) {
                const tier = randomElement(tiers);
                const status = Math.random() > 0.1 ? 'active' : 'cancelled';
                const mrr = tier === 'free' ? 0 : tier === 'pro' ? 29 : tier === 'business' ? 99 : 299;

                const { data: sub, error: subError } = await supabase.from('subscriptions').insert({
                    user_id: user.id,
                    email: user.email,          // required NOT NULL field
                    full_name: `User ${users.indexOf(user)}`,
                    tier: tier,
                    status: status,
                    mrr: mrr,
                    joined_at: randomDate(new Date(2025, 0, 1), new Date()),
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    metadata: {}
                }).select().single();

                if (subError) {
                    console.warn(`   ⚠️  Subscription insert failed for ${user.email}:`, subError.message);
                } else if (sub) {
                    // Store mrr on sub object for invoice seeding later
                    subs.push({ ...sub, monthly_amount: mrr });
                }
            }
        }
        console.log(`   ✅  Created ${subs.length} subscriptions.`);

        // 3. Seed Invoices
        console.log('nf  Seeding Invoices...');
        for (const sub of subs) {
            // Generate 1-5 invoices per subscription
            const count = randomInt(1, 5);
            for (let k = 0; k < count; k++) {
                const amount = sub.monthly_amount * 100; // cents
                if (amount === 0) continue;

                await supabase.from('invoices').insert({
                    user_id: sub.user_id,
                    subscription_id: sub.id,
                    stripe_invoice_id: `in_${Math.random().toString(36).substring(7)}`,
                    stripe_customer_id: `cus_${Math.random().toString(36).substring(7)}`,
                    amount_due: amount,
                    amount_paid: amount,
                    currency: 'usd',
                    status: 'paid',
                    created_at: randomDate(new Date(sub.joined_at), new Date())
                });
            }
        }
        console.log('   ✅  Invoices seeded.');

        // 4. Seed Activity Log
        console.log('rg  Seeding Activity Log...');
        if (users.length > 0) {
            const actions = ['login', 'update_profile', 'view_report', 'export_data', 'create_project', 'update_settings'];
            const activityTypes = ['info', 'success', 'warning', 'error'];

            for (let j = 0; j < 50; j++) {
                const user = randomElement(users);
                if (!user) continue;
                const { error: logError } = await supabase.from('admin_activity_log').insert({
                    user_id: user.id,
                    user_email: user.email,
                    action: randomElement(actions),
                    action_type: randomElement(activityTypes),
                    metadata: { ip: '127.0.0.1', agent: 'Mozilla/5.0' },
                    created_at: randomDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), new Date())
                });
                if (logError) console.warn(`   ⚠️  Activity log insert failed:`, logError.message);
            }
            console.log('   ✅  Activity logs seeded.');
        } else {
            console.log('   ⚠️  Skipping Activity Log (no users).');
        }

        // 5. Seed System Status
        console.log('hp  Seeding System Status...');
        const services = ['Database', 'API', 'Storage', 'Auth', 'Edge Functions', 'Stripe Integration'];
        for (const svc of services) {
            await supabase.from('system_status').upsert({
                service_name: svc,
                status: 'operational',
                uptime_percentage: 99.9 + (Math.random() * 0.09),
                last_checked: new Date().toISOString(),
                metadata: { latency_ms: randomInt(20, 150) }
            }, { onConflict: 'service_name' });
        }
        console.log('   ✅  System status seeded.');

        // 6. Seed AI Agents
        console.log('🤖  Seeding AI Agents...');
        const agents = [
            {
                agent_type: 'scheduler',
                label: 'Scheduler',
                description: 'Manages project schedules, timelines, dependencies, and critical path analysis',
                icon: 'Calendar',
                color: 'text-blue-500',
                system_prompt: 'You are a project scheduling assistant specializing in timeline planning, dependency management, and critical path analysis. Help users optimize schedules, identify bottlenecks, and maintain realistic project timelines. Provide actionable recommendations for schedule improvements.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'finance',
                label: 'Finance',
                description: 'Handles budget analysis, cost tracking, variety analysis, and financial forecasting',
                icon: 'DollarSign',
                color: 'text-green-500',
                system_prompt: 'You are a financial analyst assistant for project management. Analyze budgets, track costs, identify variances, and provide forecasts. Help users understand financial health, optimize spending, and make data-driven budget decisions.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'risk',
                label: 'Risk',
                description: 'Identifies, analyzes, and provides mitigation strategies for project risks',
                icon: 'AlertTriangle',
                color: 'text-orange-500',
                system_prompt: 'You are a risk management specialist. Identify potential project risks, assess probability and impact, suggest mitigation strategies, and track risk exposure. Help users proactively manage uncertainties and maintain contingency plans.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'assignment',
                label: 'Assignment',
                description: 'Manages resource allocation, workload balancing, and task assignments',
                icon: 'Users',
                color: 'text-purple-500',
                system_prompt: 'You are a resource management assistant. Optimize team assignments based on skills, availability, workload, and capacity. Help balance work distribution, identify overallocation, and suggest efficient resource utilization.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'meeting',
                label: 'Meeting',
                description: 'Handles meeting management, agenda generation, note-taking, and action items',
                icon: 'Video',
                color: 'text-pink-500',
                system_prompt: 'You are a meeting assistant. Generate agendas, take notes, extract action items, summarize discussions, and track follow-ups. Help make meetings productive and ensure clear outcomes.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'document',
                label: 'Document',
                description: 'Generates reports, analyzes documents, and extracts key information',
                icon: 'FileText',
                color: 'text-indigo-500',
                system_prompt: 'You are a documentation specialist. Generate project reports, analyze documents, extract key information, summarize content, and maintain documentation quality. Help create clear, professional documentation.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            },
            {
                agent_type: 'insight',
                label: 'Insight',
                description: 'Provides data insights, identifies patterns, and offers recommendations',
                icon: 'Lightbulb',
                color: 'text-yellow-500',
                system_prompt: 'You are an insights analyst. Identify patterns in project data, surface trends, provide data-driven recommendations, and highlight important metrics. Help users make informed decisions based on project analytics.',
                model_provider: 'anthropic',
                model_name: 'claude-3-opus'
            },
            {
                agent_type: 'strategic',
                label: 'Strategic',
                description: 'Handles portfolio-level planning, strategic alignment, and executive insights',
                icon: 'Target',
                color: 'text-red-500',
                system_prompt: 'You are a strategic advisor for portfolio and program management. Provide portfolio-level insights, strategic recommendations, alignment analysis, and executive summaries. Help optimize portfolio value and strategic outcomes.',
                model_provider: 'anthropic',
                model_name: 'claude-3-opus'
            },
            {
                agent_type: 'communication',
                label: 'Communication',
                description: 'Analyzes team communication, tracks sentiment, and identifies collaboration patterns',
                icon: 'MessageCircle',
                color: 'text-cyan-500',
                system_prompt: 'You are a communication analyst. Analyze team messages, track sentiment, identify collaboration patterns, surface communication issues, and provide recommendations for better team dynamics.',
                model_provider: 'google',
                model_name: 'gemini-pro'
            },
            {
                agent_type: 'system',
                label: 'System',
                description: 'General-purpose assistant for miscellaneous queries and information',
                icon: 'Bot',
                color: 'text-muted-foreground',
                system_prompt: 'You are a general project management assistant. Answer questions, provide helpful information, guide users, and handle miscellaneous queries. Be helpful, clear, and concise.',
                model_provider: 'openai',
                model_name: 'gpt-4-turbo'
            },
            {
                agent_type: 'multi-agent',
                label: 'Multi-Agent',
                description: 'Coordinates multiple specialized agents to solve complex multi-faceted problems',
                icon: 'Network',
                color: 'text-primary',
                system_prompt: 'You coordinate multiple specialized AI agents to solve complex, multi-faceted problems. Analyze user requests, determine which agents to involve, orchestrate their collaboration, and synthesize their outputs into cohesive solutions.',
                model_provider: 'openai',
                model_name: 'gpt-4'
            }
        ];

        const { error: agentsError } = await supabase
            .from('ai_agents')
            .upsert(agents, { onConflict: 'agent_type' });

        if (agentsError) {
            console.error('   ❌ Failed to seed AI Agents:', agentsError.message);
        } else {
            console.log(`   ✅  Seeded ${agents.length} AI Agents.`);
        }

        console.log('\n🎉  Admin Data Seeding Complete!');

    } catch (err) {
        console.error('❌  Seeding failed:', err);
        process.exit(1);
    }
}

seedData();
