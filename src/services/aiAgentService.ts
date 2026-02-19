/**
 * AI Agent Service
 * 
 * Service layer for interacting with AI agent database tables.
 * Replaces hardcoded AGENT_DISPLAY_INFO from types/ai-agents.ts
 */

import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export interface AIAgent {
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
    created_at: string;
    updated_at: string;
}

export interface AIAgentCapability {
    id: string;
    agent_id: string;
    capability_key: string;
    description: string | null;
    requires_role: string[];
    created_at: string;
}

export interface AIAgentSetting {
    id: string;
    agent_id: string;
    setting_key: string;
    setting_value: any; // JSONB
    created_at: string;
    updated_at: string;
}

export interface AIAgentVersion {
    id: string;
    agent_id: string;
    version: number;
    system_prompt: string | null;
    model_provider: string | null;
    model_name: string | null;
    is_active: boolean;
    performance_metrics: any; // JSONB
    created_at: string;
    created_by: string | null;
}

/**
 * Fetch all active AI agents
 */
export async function getActiveAgents(): Promise<AIAgent[]> {
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('is_active', true)
        .order('agent_type');

    if (error) throw error;
    return data || [];
}

/**
 * Fetch all AI agents (including inactive)
 */
export async function getAllAgents(): Promise<AIAgent[]> {
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .order('agent_type');

    if (error) throw error;
    return data || [];
}

/**
 * Get agent by type
 */
export async function getAgentByType(agentType: string): Promise<AIAgent | null> {
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('agent_type', agentType)
        .eq('is_active', true)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get agent by ID
 */
export async function getAgentById(agentId: string): Promise<AIAgent | null> {
    const { data, error } = await supabase
        .from('ai_agents')
        .select('*')
        .eq('id', agentId)
        .maybeSingle();

    if (error) throw error;
    return data;
}

/**
 * Get agent with capabilities
 */
export async function getAgentWithCapabilities(agentType: string): Promise<{
    agent: AIAgent;
    capabilities: AIAgentCapability[];
} | null> {
    const agent = await getAgentByType(agentType);
    if (!agent) return null;

    const { data: capabilities, error } = await supabase
        .from('ai_agent_capabilities')
        .select('*')
        .eq('agent_id', agent.id);

    if (error) throw error;

    return {
        agent,
        capabilities: capabilities || [],
    };
}

/**
 * Check if user has permission for agent capability
 */
export async function checkAgentCapability(
    agentId: string,
    userRole: string,
    capabilityKey: string
): Promise<boolean> {
    const { data, error } = await supabase
        .from('ai_agent_capabilities')
        .select('requires_role')
        .eq('agent_id', agentId)
        .eq('capability_key', capabilityKey)
        .maybeSingle();

    if (error) throw error;
    if (!data) return false; // Capability doesn't exist

    return data.requires_role.includes(userRole);
}

/**
 * Get all capabilities for an agent
 */
export async function getAgentCapabilities(agentId: string): Promise<AIAgentCapability[]> {
    const { data, error } = await supabase
        .from('ai_agent_capabilities')
        .select('*')
        .eq('agent_id', agentId)
        .order('capability_key');

    if (error) throw error;
    return data || [];
}

/**
 * Admin: Create new AI agent
 */
export async function createAgent(agent: Partial<AIAgent>): Promise<AIAgent> {
    const { data, error } = await supabase
        .from('ai_agents')
        .insert({
            agent_type: agent.agent_type,
            label: agent.label,
            description: agent.description,
            icon: agent.icon,
            color: agent.color,
            system_prompt: agent.system_prompt,
            model_provider: agent.model_provider || 'openai',
            model_name: agent.model_name || 'gpt-4',
            max_tokens: agent.max_tokens || 2000,
            temperature: agent.temperature || 0.7,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Admin: Update agent configuration
 */
export async function updateAgent(
    agentId: string,
    updates: Partial<AIAgent>
): Promise<AIAgent> {
    // Increment version
    const currentAgent = await getAgentById(agentId);
    if (!currentAgent) throw new Error('Agent not found');

    const newVersion = (currentAgent.version || 0) + 1;

    const { data, error } = await supabase
        .from('ai_agents')
        .update({
            ...updates,
            version: newVersion,
            updated_at: new Date().toISOString()
        })
        .eq('id', agentId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Admin: Toggle agent active status
 */
export async function toggleAgentStatus(agentId: string): Promise<AIAgent> {
    const current = await getAgentById(agentId);
    if (!current) throw new Error('Agent not found');

    const { data, error } = await supabase
        .from('ai_agents')
        .update({ is_active: !current.is_active })
        .eq('id', agentId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Admin: Delete agent
 */
export async function deleteAgent(agentId: string): Promise<void> {
    const { error } = await supabase
        .from('ai_agents')
        .delete()
        .eq('id', agentId);

    if (error) throw error;
}

/**
 * Admin: Add capability to agent
 */
export async function addAgentCapability(
    agentId: string,
    capabilityKey: string,
    description: string,
    requiresRole: string[]
): Promise<AIAgentCapability> {
    const { data, error } = await supabase
        .from('ai_agent_capabilities')
        .insert({
            agent_id: agentId,
            capability_key: capabilityKey,
            description,
            requires_role: requiresRole,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Admin: Remove capability from agent
 */
export async function removeAgentCapability(capabilityId: string): Promise<void> {
    const { error } = await supabase
        .from('ai_agent_capabilities')
        .delete()
        .eq('id', capabilityId);

    if (error) throw error;
}

/**
 * Get agent settings
 */
export async function getAgentSettings(agentId: string): Promise<AIAgentSetting[]> {
    const { data, error } = await supabase
        .from('ai_agent_settings')
        .select('*')
        .eq('agent_id', agentId)
        .order('setting_key');

    if (error) throw error;
    return data || [];
}

/**
 * Set agent setting
 */
export async function setAgentSetting(
    agentId: string,
    settingKey: string,
    settingValue: any
): Promise<AIAgentSetting> {
    const { data, error } = await supabase
        .from('ai_agent_settings')
        .upsert({
            agent_id: agentId,
            setting_key: settingKey,
            setting_value: settingValue,
            updated_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Get agent version history
 */
export async function getAgentVersions(agentId: string): Promise<AIAgentVersion[]> {
    const { data, error } = await supabase
        .from('ai_agent_versions')
        .select('*')
        .eq('agent_id', agentId)
        .order('version', { ascending: false });

    if (error) throw error;
    return data || [];
}

/**
 * Create agent version snapshot
 */
export async function createAgentVersion(
    agentId: string,
    systemPrompt: string,
    modelProvider: string,
    modelName: string,
    userId?: string
): Promise<AIAgentVersion> {
    const currentAgent = await getAgentById(agentId);
    if (!currentAgent) throw new Error('Agent not found');

    const versions = await getAgentVersions(agentId);
    const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version)) + 1 : 1;

    const { data, error } = await supabase
        .from('ai_agent_versions')
        .insert({
            agent_id: agentId,
            version: nextVersion,
            system_prompt: systemPrompt,
            model_provider: modelProvider,
            model_name: modelName,
            is_active: false,
            created_by: userId,
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/**
 * Activate specific agent version
 */
export async function activateAgentVersion(versionId: string): Promise<void> {
    const { data: version, error: versionError } = await supabase
        .from('ai_agent_versions')
        .select('*')
        .eq('id', versionId)
        .single();

    if (versionError) throw versionError;

    // Deactivate all versions for this agent
    await supabase
        .from('ai_agent_versions')
        .update({ is_active: false })
        .eq('agent_id', version.agent_id);

    // Activate this version
    await supabase
        .from('ai_agent_versions')
        .update({ is_active: true })
        .eq('id', versionId);

    // Update main agent record
    await updateAgent(version.agent_id, {
        system_prompt: version.system_prompt || undefined,
        model_provider: version.model_provider || undefined,
        model_name: version.model_name || undefined,
    });
}

/**
 * Log AI interaction
 */
export async function logAIInteraction(
    agentId: string,
    query: string,
    responseTimeMs: number,
    tokens: number,
    provider: string,
    model: string,
    feedbackScore?: number,
    feedbackText?: string
): Promise<string> {
    const { data, error } = await supabase
        .from('ai_interaction_logs')
        .insert({
            agent_id: agentId,
            query_summary: query.slice(0, 100) + (query.length > 100 ? '...' : ''),
            response_time_ms: responseTimeMs,
            tokens_total: tokens,
            provider,
            model,
            feedback_score: feedbackScore,
            feedback_text: feedbackText
        })
        .select('id')
        .single();

    if (error) throw error;
    return data.id;
}

/**
 * Update AI interaction feedback
 */
export async function updateInteractionFeedback(
    logId: string,
    score: number,
    text?: string
): Promise<void> {
    const { error } = await supabase
        .from('ai_interaction_logs')
        .update({
            feedback_score: score,
            feedback_text: text,
        })
        .eq('id', logId);

    if (error) throw error;
}
