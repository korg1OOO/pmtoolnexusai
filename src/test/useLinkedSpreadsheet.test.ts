/**
 * useLinkedSpreadsheet Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: vi.fn().mockResolvedValue({ data: { user: null } }),
            getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
            onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
        },
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(), neq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(), lte: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(), range: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            then: (r) => r({ data: [], error: null, count: 0 }),
        })),
        channel: vi.fn().mockReturnValue({
            on: vi.fn().mockReturnThis(),
            subscribe: vi.fn().mockReturnValue({ unsubscribe: vi.fn() }),
        }),
        removeChannel: vi.fn(),
        functions: { invoke: vi.fn().mockResolvedValue({ data: null, error: null }) },
        rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
}));

vi.mock('@/hooks/use-toast', () => ({
    ToastVariant: vi.fn(),
    toast: vi.fn(),
    useToast: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

vi.mock('@/hooks/useSpreadsheets', () => ({
    useSpreadsheets: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useSheets: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

vi.mock('@/hooks/useTasks', () => ({
    TaskType: vi.fn(),
    TaskStatus: vi.fn(),
    PriorityLevel: vi.fn(),
    ConstraintType: vi.fn(),
    useTasks: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useDependencies: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useBaselines: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useCreateTask: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useUpdateTask: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useBulkUpdateTasks: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useDeleteTask: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useCreateDependency: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useDeleteDependency: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useUpdateDependency: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useCreateBaseline: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
    useSaveProjectBaseline: vi.fn().mockReturnValue({ data: null, isLoading: false, error: null }),
}));

import { useLinkedSpreadsheet, PROJECT_PLAN_COLUMNS } from '@/hooks/useLinkedSpreadsheet';

describe('useLinkedSpreadsheet', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useLinkedSpreadsheet).toBeDefined();
            expect(PROJECT_PLAN_COLUMNS).toBeDefined();
        });
    });

    describe('useLinkedSpreadsheet', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useLinkedSpreadsheet());
            expect(result.current).toBeDefined();
        });
    });
});
