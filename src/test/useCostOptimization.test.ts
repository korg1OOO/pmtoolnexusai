/**
 * useCostOptimization Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { createWrapper } from './testUtils';

import { useCostOptimization, useModelAlternatives } from '@/hooks/useCostOptimization';

describe('useCostOptimization', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useCostOptimization).toBeDefined();
            expect(useModelAlternatives).toBeDefined();
        });
    });

    describe('useCostOptimization', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useCostOptimization(), { wrapper: createWrapper() });
            expect(result.current).toBeDefined();
        });
    });
});
