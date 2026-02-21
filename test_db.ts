import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

console.log("Connecting to:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'admin@projectoye.com',
    password: 'admin123'
  });

  if (authErr) {
    console.error("Login failed:", authErr);
    return;
  }

  console.log("Logged in as admin. Checking agents...");

  const { data: current, error: checkError } = await supabase.from('ai_agents').select('*');
  console.log("Current agents:", current?.length);
  if (checkError) console.error(checkError);

  if (current?.length === 0 || !current) {
    console.log("Seeding AI Agents...");
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

    const { data, error } = await supabase.from('ai_agents').insert(agents).select();
    if (error) console.error("Insert error:", error);
    else console.log("Seeded successfully:", data?.length);
  } else {
    console.log("Agents already exist. Enabling them if inactive.");
    const { data, error } = await supabase.from('ai_agents').update({ is_active: true }).neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) console.error("Update error:", error);
  }
}
seed();
