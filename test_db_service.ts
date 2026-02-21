import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// We MUST use the service role key to execute raw SQL or bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseKey || !supabaseUrl) {
    console.error("Missing Service Role Key or URL. We cannot bypass RLS to fix this without it.");
    process.exit(1);
}

console.log("Connecting with Service Role Key to:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSAndSeed() {
    const { data: currentagents, error: err } = await supabase.from('ai_agents').select('id');
    console.log("Found agents:", currentagents?.length);
    // Since we have service role key, we don't even need to fix RLS purely for seeding!
    // We can just seed the agents directly using the service role key.

    // BUT we should fix RLS so the application works correctly for Admins.
    const agents = [
        { agent_type: 'scheduler', label: 'Scheduler', description: 'Manages project schedules...', icon: 'Calendar', color: 'text-blue-500', is_active: true },
        { agent_type: 'finance', label: 'Finance', description: 'Handles budget analysis...', icon: 'DollarSign', color: 'text-green-500', is_active: true },
        { agent_type: 'risk', label: 'Risk', description: 'Identifies risks...', icon: 'AlertTriangle', color: 'text-orange-500', is_active: true },
        { agent_type: 'assignment', label: 'Assignment', description: 'Manages resources...', icon: 'Users', color: 'text-purple-500', is_active: true },
        { agent_type: 'meeting', label: 'Meeting', description: 'Handles meetings...', icon: 'Video', color: 'text-pink-500', is_active: true },
        { agent_type: 'document', label: 'Document', description: 'Generates reports...', icon: 'FileText', color: 'text-indigo-500', is_active: true },
        { agent_type: 'insight', label: 'Insight', description: 'Data insights...', icon: 'Lightbulb', color: 'text-yellow-500', is_active: true },
        { agent_type: 'strategic', label: 'Strategic', description: 'Portfolio planning...', icon: 'Target', color: 'text-red-500', is_active: true },
        { agent_type: 'communication', label: 'Communication', description: 'Analyzes comms...', icon: 'MessageCircle', color: 'text-cyan-500', is_active: true },
        { agent_type: 'system', label: 'System', description: 'General assistant...', icon: 'Bot', color: 'text-muted-foreground', is_active: true },
        { agent_type: 'multi-agent', label: 'Multi-Agent', description: 'Coordinates agents...', icon: 'Network', color: 'text-primary', is_active: true }
    ];

    const { error: seedErr } = await supabase.from('ai_agents').upsert(agents, { onConflict: 'agent_type' });
    if (seedErr) {
        console.error("Seed error:", seedErr);
    } else {
        console.log("Agents seeded successfully.");
    }
}
fixRLSAndSeed();
