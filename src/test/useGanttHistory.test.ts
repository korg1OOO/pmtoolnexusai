/**
 * useGanttHistory Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useGanttHistory } from '@/hooks/useGanttHistory';

describe('useGanttHistory', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useGanttHistory).toBeDefined();
        });
    });

    describe('useGanttHistory', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useGanttHistory());
            expect(result.current).toBeDefined();
        });
    });
});
