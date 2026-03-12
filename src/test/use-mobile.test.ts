/**
 * use-mobile Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { useIsMobile } from '@/hooks/use-mobile';

describe('use-mobile', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useIsMobile).toBeDefined();
        });
    });

});
