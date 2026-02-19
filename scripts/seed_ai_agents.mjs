
import { createClient } from '@supabase/supabase-js';
import { config as dotenvConfig } from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Load .env
dotenvConfig({ path: join(rootDir, '.env'), override: true });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

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

async function seed() {
    console.log(`Seeding ${agents.length} AI Agents...`);
    const { data, error } = await supabase
        .from('ai_agents')
        .upsert(agents, { onConflict: 'agent_type' })
        .select();

    if (error) {
        console.error('Error seeding agents:', error);
        process.exit(1);
    }

    console.log(`Successfully seeded ${data.length} agents.`);
}

seed();
