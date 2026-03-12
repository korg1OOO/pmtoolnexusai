/**
 * useAIAgents Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

import { useAIAgents, useAllAIAgents, useAIAgent, useAIAgentWithCapabilities, useAgentCapabilities, useCheckAgentCapability, useCreateAIAgent, useUpdateAIAgent, useToggleAIAgent, useDeleteAIAgent, useAddAgentCapability, useRemoveAgentCapability, useAgentSettings, useSetAgentSetting, useAgentVersions, useCreateAgentVersion, useActivateAgentVersion, useLogAIInteraction, useUpdateInteractionFeedback } from '@/hooks/useAIAgents';

describe('useAIAgents', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useAIAgents).toBeDefined();
            expect(useAllAIAgents).toBeDefined();
            expect(useAIAgent).toBeDefined();
            expect(useAIAgentWithCapabilities).toBeDefined();
            expect(useAgentCapabilities).toBeDefined();
            expect(useCheckAgentCapability).toBeDefined();
            expect(useCreateAIAgent).toBeDefined();
            expect(useUpdateAIAgent).toBeDefined();
            expect(useToggleAIAgent).toBeDefined();
            expect(useDeleteAIAgent).toBeDefined();
            expect(useAddAgentCapability).toBeDefined();
            expect(useRemoveAgentCapability).toBeDefined();
            expect(useAgentSettings).toBeDefined();
            expect(useSetAgentSetting).toBeDefined();
            expect(useAgentVersions).toBeDefined();
            expect(useCreateAgentVersion).toBeDefined();
            expect(useActivateAgentVersion).toBeDefined();
            expect(useLogAIInteraction).toBeDefined();
            expect(useUpdateInteractionFeedback).toBeDefined();
        });
    });

    describe('useAIAgents', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useAIAgents(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
