/**
 * useNotificationAnalytics Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

import { useNotificationMetrics, useChannelPerformance, useTemplatePerformance, useNotificationTimeSeries } from '@/hooks/useNotificationAnalytics';

describe('useNotificationAnalytics', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useNotificationMetrics).toBeDefined();
            expect(useChannelPerformance).toBeDefined();
            expect(useTemplatePerformance).toBeDefined();
            expect(useNotificationTimeSeries).toBeDefined();
        });
    });

    describe('useNotificationMetrics', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useNotificationMetrics(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
