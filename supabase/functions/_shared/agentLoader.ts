/**
 * AI Agent Configuration Loader for Edge Functions
 * 
 * Loads AI agent configurations from database instead of hardcoded values.
 * This file should be imported by ai-orchestrator Edge Function.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface AIAgentConfig {
    id: string;
    agent_type: string;
    label: string;
    description: string | null;
    icon: string;
    color: string;
    system_prompt: string | null;
    model_provider: string;
    model_name: string;
    max_tokens: number;
    temperature: number;
    is_active: boolean;
    version: number;
}

export interface AIAgentCapability {
    id: string;
    agent_id: string;
    capability_key: string;
    description: string | null;
    requires_role: string[];
}

// In-memory cache for agent configurations (5 minute TTL)
const agentCache: Map<string, { config: AIAgentConfig; timestamp: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Load agent configuration from database with caching
 */
export async function loadAgentConfig(
    supabase: SupabaseClient,
    agentType: string
): Promise<AIAgentConfig | null> {
    // Check cache first
    const cached = agentCache.get(agentType);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.config;
    }

    // Fetch from database
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .maybeSingle();

    if (error) {
        console.error(`Error loading agent ${agentType}:`, error);
        return null;
    }

    if (!data) {
        console.warn(`Agent ${agentType} not found or inactive`);
        return null;
    }

    // Cache the result
    agentCache.set(agentType, {
        config: data as AIAgentConfig,
        timestamp: Date.now()
    });

    return data as AIAgentConfig;
}

/**
 * Load agent capabilities from database
 */
export async function loadAgentCapabilities(
    supabase: SupabaseClient,
    agentId: string
): Promise<AIAgentCapability[]> {
    const { data, error } = await supabase
        .from('ai_agent_capabilities')
        .select('*')
        .eq('agent_id', agentId);

    if (error) {
        console.error(`Error loading capabilities for agent ${agentId}:`, error);
        return [];
    }

    return (data as AIAgentCapability[]) || [];
}

/**
 * Check if user has permission for agent capability
 */
export function hasCapability(
    capabilities: AIAgentCapability[],
    userRole: string,
    capabilityKey: string
): boolean {
    const capability = capabilities.find(c => c.capability_key === capabilityKey);
    if (!capability) return false;

    return capability.requires_role.includes(userRole);
}

/**
 * Load all active agents  
 */
export async function loadAllActiveAgents(
    supabase: SupabaseClient
): Promise<AIAgentConfig[]> {
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('agent_type');

    if (error) {
        console.error('Error loading all agents:', error);
        return [];
    }

    return (data as AIAgentConfig[]) || [];
}

/**
 * Get default system prompt if database value is null
 */
export function getDefaultSystemPrompt(agentType: string): string {
    const defaults: Record<string, string> = {
        scheduler: `You are SchedulerAgent, an expert in project scheduling and timeline management.

Your capabilities:
- Analyze project schedules and timelines
- Identify critical path dependencies
- Calculate impact of date changes
- Recommend schedule optimizations
- Detect scheduling conflicts

Provide specific, actionable insights about the schedule. Reference actual task names and dates from the context.`,

        finance: `You are FinanceAgent, an expert in project financial management and EVM analysis.

Your capabilities:
- Budget status analysis
- Cost variance analysis
- Earned Value Management (EVM) calculations
- Financial forecasting
- Resource cost analysis

Provide detailed financial analysis with specific numbers. Calculate CPI, SPI, and EAC when relevant.`,

        risk: `You are RiskAgent, an expert in project risk management and mitigation.

Your capabilities:
- Risk identification and scoring
- Impact and probability assessment
- Mitigation strategy recommendations
- Critical path risk analysis
- Pattern recognition for common project risks

Identify specific risks based on the project data. Score risks using a 1-5 scale for impact and probability.`,

        assignment: `You are AssignmentAgent, an expert in resource allocation and team optimization.

Your capabilities:
- Optimal task assignment recommendations
- Workload balancing analysis
- Skill matching for tasks
- Capacity planning
- Team utilization analysis

When recommending assignments, consider resource availability, skills, and current workload.`,

        meeting: `You are MeetingAgent, an expert in meeting intelligence and action tracking.

Your capabilities:
- Meeting summary generation
- Action item extraction and tracking
- Decision documentation
- Follow-up monitoring
- Meeting effectiveness analysis

Reference specific meetings, decisions, and action items from the context.`,

        document: `You are DocumentAgent, an expert in project documentation and report generation.

Your capabilities:
- Status report generation
- Executive summary creation
- Progress narrative writing
- Milestone documentation
- Stakeholder communication drafts

Generate professional, well-structured documents based on actual project data.`,

        insight: `You are InsightAgent, the primary project intelligence agent.

Your capabilities:
- Overall project health assessment
- Trend analysis and predictions
- Performance recommendations
- Cross-functional insights
- Proactive issue identification

Provide holistic project insights. Be proactive in identifying potential issues.`,

        strategic: `You are StrategicAgent, an expert in strategic project analysis.

Your capabilities:
- Value engineering and trade-off analysis
- Stakeholder power mapping
- Strategic alignment assessment
- Business case validation
- Long-term impact analysis

Provide high-level strategic insights considering business value and stakeholder interests.`,

        communication: `You are CommunicationAgent, an expert in project communication analysis.

Your capabilities:
- Communication pattern analysis
- Delay signal detection
- Sentiment analysis
- Stakeholder engagement assessment
- Scope creep indicators

Analyze communication patterns and identify potential issues.`,

        system: `You are a general project management assistant. Answer questions, provide helpful information, guide users, and handle miscellaneous queries. Be helpful, clear, and concise.`,

        "multi-agent": `You coordinate multiple specialized AI agents to solve complex, multi-faceted problems. Analyze user requests, determine which agents to involve, orchestrate their collaboration, and synthesize their outputs into cohesive solutions.`,
    };

    return defaults[agentType] || defaults.insight;
}

/**
 * Clear agent cache (useful for testing or when agents are updated)
 */
export function clearAgentCache(): void {
    agentCache.clear();
}
