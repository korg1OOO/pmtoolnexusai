const url = process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function seed() {
  try {
    const res = await fetch(`${url}/rest/v1/user_tenants?select=tenant_id,user_id&limit=1`, {
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    const tenants = await res.json();
    if (!tenants || !tenants.length) {
      console.log('No tenants found.');
      return;
    }
    const { tenant_id, user_id } = tenants[0];
    console.log('Got user_id:', user_id, 'tenant_id:', tenant_id);

    // Initialize
    await fetch(`${url}/rest/v1/rpc/initialize_ai_credits`, {
      method: 'POST',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_tenant_id: tenant_id, p_user_id: user_id, p_initial_credits: 5000 })
    });

    const features = ['meeting_summary', 'risk_analysis', 'gantt_generation', 'chat_agent'];
    const models = ['gpt-4o', 'claude-3-5-sonnet'];
    
    let count = 0;
    for(let i=0; i<30; i++) {
        const prompt_tokens = Math.floor(Math.random() * 500) + 100;
        const completion_tokens = Math.floor(Math.random() * 800) + 200;
        const credits = (prompt_tokens + completion_tokens) / 1000 * 2;
        
        const daysAgo = Math.floor(Math.random() * 28);
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);

        const rpcRes = await fetch(`${url}/rest/v1/rpc/deduct_ai_credits`, {
          method: 'POST',
          headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
              p_tenant_id: tenant_id,
              p_user_id: user_id,
              p_feature_type: features[Math.floor(Math.random() * features.length)],
              p_request_id: require('crypto').randomUUID(),
              p_model_name: models[Math.floor(Math.random() * models.length)],
              p_prompt_tokens: prompt_tokens,
              p_completion_tokens: completion_tokens,
              p_credits_used: credits
          })
        });
        const rpcData = await rpcRes.json();
        const usageId = rpcData && rpcData.length ? rpcData[0].usage_id : rpcData?.usage_id;
        
        if (usageId) {
            await fetch(`${url}/rest/v1/ai_usage_logs?id=eq.${usageId}`, {
              method: 'PATCH',
              headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ created_at: date.toISOString() })
            });
            count++;
        }
    }
    console.log(`Seeded ${count} usage logs.`);
  } catch(e) {
    console.error(e);
  }
}
seed();
