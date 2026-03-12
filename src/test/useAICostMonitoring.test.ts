/**
 * useAICostMonitoring Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

import { useWeeklyReviews, useMinimalImpactAlternatives, useSpendingSummary, useBudgetAlerts } from '@/hooks/useAICostMonitoring';

describe('useAICostMonitoring', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useWeeklyReviews).toBeDefined();
            expect(useMinimalImpactAlternatives).toBeDefined();
            expect(useSpendingSummary).toBeDefined();
            expect(useBudgetAlerts).toBeDefined();
        });
    });

    describe('useWeeklyReviews', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useWeeklyReviews(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
