/**
 * AI Agent Hooks
 * 
 * React Query hooks for managing AI agents
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as aiAgentService from '@/services/aiAgentService';
import type { AIAgent, AIAgentCapability } from '@/services/aiAgentService';

/**
 * Fetch all active AI agents
 */
export function useAIAgents() {
    return useQuery({
        queryKey: ['ai-agents'],
        queryFn: aiAgentService.getActiveAgents,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Fetch all agents (including inactive) - Admin only
 */
export function useAllAIAgents() {
    return useQuery({
        queryKey: ['ai-agents', 'all'],
        queryFn: aiAgentService.getAllAgents,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch specific AI agent by type
 */
export function useAIAgent(agentType: string) {
    return useQuery({
        queryKey: ['ai-agent', agentType],
        queryFn: () => aiAgentService.getAgentByType(agentType),
        enabled: !!agentType,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch agent with capabilities
 */
export function useAIAgentWithCapabilities(agentType: string) {
    return useQuery({
        queryKey: ['ai-agent', agentType, 'capabilities'],
        queryFn: () => aiAgentService.getAgentWithCapabilities(agentType),
        enabled: !!agentType,
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Fetch agent capabilities
 */
export function useAgentCapabilities(agentId: string) {
    return useQuery({
        queryKey: ['ai-agent-capabilities', agentId],
        queryFn: () => aiAgentService.getAgentCapabilities(agentId),
        enabled: !!agentId,
    });
}

/**
 * Check capability permission
 */
export function useCheckAgentCapability(
    agentId: string,
    userRole: string,
    capabilityKey: string
) {
    return useQuery({
        queryKey: ['ai-agent-capability-check', agentId, userRole, capabilityKey],
        queryFn: () => aiAgentService.checkAgentCapability(agentId, userRole, capabilityKey),
        enabled: !!agentId && !!userRole && !!capabilityKey,
    });
}

/**
 * Create new AI agent (Admin)
 */
export function useCreateAIAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: aiAgentService.createAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
        },
    });
}

/**
 * Update AI agent (Admin)
 */
export function useUpdateAIAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<AIAgent> }) =>
            aiAgentService.updateAgent(id, updates),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
            queryClient.invalidateQueries({ queryKey: ['ai-agent', data.agent_type] });
        },
    });
}

/**
 * Toggle agent active status (Admin)
 */
export function useToggleAIAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: aiAgentService.toggleAgentStatus,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
        },
    });
}

/**
 * Delete AI agent (Admin)
 */
export function useDeleteAIAgent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: aiAgentService.deleteAgent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
        },
    });
}

/**
 * Add capability to agent (Admin)
 */
export function useAddAgentCapability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            agentId,
            capabilityKey,
            description,
            requiresRole,
        }: {
            agentId: string;
            capabilityKey: string;
            description: string;
            requiresRole: string[];
        }) => aiAgentService.addAgentCapability(agentId, capabilityKey, description, requiresRole),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ai-agent-capabilities', variables.agentId] });
        },
    });
}

/**
 * Remove capability from agent (Admin)
 */
export function useRemoveAgentCapability() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: aiAgentService.removeAgentCapability,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agent-capabilities'] });
        },
    });
}

/**
 * Get agent settings
 */
export function useAgentSettings(agentId: string) {
    return useQuery({
        queryKey: ['ai-agent-settings', agentId],
        queryFn: () => aiAgentService.getAgentSettings(agentId),
        enabled: !!agentId,
    });
}

/**
 * Set agent setting (Admin)
 */
export function useSetAgentSetting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            agentId,
            settingKey,
            settingValue,
        }: {
            agentId: string;
            settingKey: string;
            settingValue: any;
        }) => aiAgentService.setAgentSetting(agentId, settingKey, settingValue),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ai-agent-settings', variables.agentId] });
        },
    });
}

/**
 * Get agent version history
 */
export function useAgentVersions(agentId: string) {
    return useQuery({
        queryKey: ['ai-agent-versions', agentId],
        queryFn: () => aiAgentService.getAgentVersions(agentId),
        enabled: !!agentId,
    });
}

/**
 * Create agent version snapshot (Admin)
 */
export function useCreateAgentVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            agentId,
            systemPrompt,
            modelProvider,
            modelName,
            userId,
        }: {
            agentId: string;
            systemPrompt: string;
            modelProvider: string;
            modelName: string;
            userId?: string;
        }) => aiAgentService.createAgentVersion(agentId, systemPrompt, modelProvider, modelName, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['ai-agent-versions', variables.agentId] });
        },
    });
}

/**
 * Activate agent version (Admin)
 */
export function useActivateAgentVersion() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: aiAgentService.activateAgentVersion,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agents'] });
            queryClient.invalidateQueries({ queryKey: ['ai-agent-versions'] });
        },
    });
}

/**
 * Log AI interaction (for analytics & feedback)
 */
export function useLogAIInteraction() {
    return useMutation({
        mutationFn: ({
            agentId,
            query,
            responseTimeMs,
            tokens,
            provider,
            model,
            feedbackScore,
            feedbackText
        }: {
            agentId: string;
            query: string;
            responseTimeMs: number;
            tokens: number;
            provider: string;
            model: string;
            feedbackScore?: number;
            feedbackText?: string;
        }) => aiAgentService.logAIInteraction(
            agentId,
            query,
            responseTimeMs,
            tokens,
            provider,
            model,
            feedbackScore,
            feedbackText
        ),
    });
}

/**
 * Update interaction feedback
 */
export function useUpdateInteractionFeedback() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            logId,
            score,
            text
        }: {
            logId: string;
            score: number;
            text?: string;
        }) => aiAgentService.updateInteractionFeedback(logId, score, text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-agent-analytics'] });
        },
    });
}

