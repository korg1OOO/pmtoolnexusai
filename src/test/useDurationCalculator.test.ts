/**
 * useDurationCalculator Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';

import { useDurationCalculator } from '@/hooks/useDurationCalculator';

describe('useDurationCalculator', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useDurationCalculator).toBeDefined();
        });
    });

    describe('useDurationCalculator', () => {
        it('can be rendered without crashing', () => {
            const { result } = renderHook(() => useDurationCalculator());
            expect(result.current).toBeDefined();
        });
    });
});
