/**
 * useLiveData Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { useLiveData } from '@/hooks/useLiveData';

describe('useLiveData', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useLiveData).toBeDefined();
        });
    });

});

