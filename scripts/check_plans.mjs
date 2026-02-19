import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
dotenvConfig({ path: join(rootDir, '.env'), override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    console.log('Checking subscription_plans table...');
    const { data, error } = await supabase.from('subscription_plans').select('*');
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} plans.`);
        console.table(data.map(p => ({ tier: p.tier, name: p.name, active: p.active })));
    }

    console.log('Attempting manual insert...');
    const { data: ins, error: insErr } = await supabase.from('subscription_plans').insert({
        tier: 'debug_tier_' + Date.now(),
        name: 'Debug Plan',
        price_monthly: 0,
        active: true
    }).select();

    if (insErr) console.error('Insert Error:', insErr);
    else console.log('Insert Success:', ins);
}

check();
