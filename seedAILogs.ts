import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    try {
        console.log("Starting seed with URL:", supabaseUrl);
        const { data: users, error: ue } = await supabase.from('user_profiles').select('id, email').limit(1);
        if (!users || !users.length) {
            console.error("No users found", ue);
            return;
        }
        const userId = users[0].id;
        console.log("User:", userId);

        const { data: tenants, error: te } = await supabase.from('user_tenants').select('tenant_id').eq('user_id', userId).limit(1);
        if (!tenants || !tenants.length) {
            console.error("No tenant found", te);
            return;
        }
        const tenantId = tenants[0].tenant_id;
        console.log("Tenant:", tenantId);

        const { data: init, error: ie } = await supabase.rpc('initialize_ai_credits', { p_tenant_id: tenantId, p_user_id: userId, p_initial_credits: 5000 });
        console.log("Init credits completed.");

        const features = ['meeting_summary', 'risk_analysis', 'gantt_generation', 'chat_agent'];
        const models = ['gpt-4o', 'claude-3-5-sonnet'];
        
        let count = 0;
        for (let i = 0; i < 30; i++) {
            const prompt_tokens = Math.floor(Math.random() * 500) + 100;
            const completion_tokens = Math.floor(Math.random() * 800) + 200;
            const credits = (prompt_tokens + completion_tokens) / 1000 * 2;
            
            const daysAgo = Math.floor(Math.random() * 28);
            const date = new Date();
            date.setDate(date.getDate() - daysAgo);

            const { data, error } = await supabase.rpc('deduct_ai_credits', {
                p_tenant_id: tenantId,
                p_user_id: userId,
                p_feature_type: features[Math.floor(Math.random() * features.length)],
                p_request_id: crypto.randomUUID(),
                p_model_name: models[Math.floor(Math.random() * models.length)],
                p_prompt_tokens: prompt_tokens,
                p_completion_tokens: completion_tokens,
                p_credits_used: credits
            });
            
            if (data && data[0]?.usage_id) {
                await supabase.from('ai_usage_logs')
                    .update({ created_at: date.toISOString() })
                    .eq('id', data[0].usage_id);
                count++;
            } else {
                console.error("Error deducting:", error);
            }
        }
        console.log(`Seeded ${count} AI usage logs successfully.`);
    } catch (e) {
        console.error("Exception:", e);
    }
}
seed().then(() => process.exit(0)).catch(() => process.exit(1));
