/**
 * useCalendars Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

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

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { useProjectCalendars, useDefaultCalendar, useCreateCalendar, useUpdateCalendar, useCalendarExceptions, useCreateCalendarException, useDeleteCalendarException, isWorkingDay, calculateWorkingDays, addWorkingDays } from '@/hooks/useCalendars';

describe('useCalendars', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useProjectCalendars).toBeDefined();
            expect(useDefaultCalendar).toBeDefined();
            expect(useCreateCalendar).toBeDefined();
            expect(useUpdateCalendar).toBeDefined();
            expect(useCalendarExceptions).toBeDefined();
            expect(useCreateCalendarException).toBeDefined();
            expect(useDeleteCalendarException).toBeDefined();
            expect(isWorkingDay).toBeDefined();
            expect(calculateWorkingDays).toBeDefined();
            expect(addWorkingDays).toBeDefined();
        });
    });

    describe('useProjectCalendars', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useProjectCalendars(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
