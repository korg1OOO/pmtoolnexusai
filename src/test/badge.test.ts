/**
 * badge Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Badge, badgeVariants } from '@/components/ui/badge';

describe('badge', () => {
    it('exports Badge', () => {
        expect(Badge).toBeDefined();
    });
    it('exports badgeVariants', () => {
        expect(badgeVariants).toBeDefined();
    });
});
