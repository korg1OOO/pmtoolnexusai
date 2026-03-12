/**
 * useEmailTemplates Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useEmailTemplates, useEmailTemplate, useTemplateVersionHistory, useCreateTemplate, useUpdateTemplate, useDeleteTemplate, useRollbackTemplate, useTestSendEmail } from '@/hooks/useEmailTemplates';

describe('useEmailTemplates', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useEmailTemplates).toBeDefined();
            expect(useEmailTemplate).toBeDefined();
            expect(useTemplateVersionHistory).toBeDefined();
            expect(useCreateTemplate).toBeDefined();
            expect(useUpdateTemplate).toBeDefined();
            expect(useDeleteTemplate).toBeDefined();
            expect(useRollbackTemplate).toBeDefined();
            expect(useTestSendEmail).toBeDefined();
        });
    });

    describe('useEmailTemplates', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useEmailTemplates(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
