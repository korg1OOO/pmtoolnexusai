/**
 * toggle Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Toggle, toggleVariants } from '@/components/ui/toggle';

describe('toggle', () => {
    it('exports Toggle', () => {
        expect(Toggle).toBeDefined();
    });
    it('exports toggleVariants', () => {
        expect(toggleVariants).toBeDefined();
    });
});
