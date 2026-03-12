/**
 * useFilterPersistence Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { useFilterPersistence } from '@/hooks/useFilterPersistence';

describe('useFilterPersistence', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useFilterPersistence).toBeDefined();
        });
    });

});

