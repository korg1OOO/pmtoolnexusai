/**
 * popover Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { PopoverContent, Popover, PopoverTrigger } from '@/components/ui/popover';

describe('popover', () => {
    it('exports PopoverContent', () => {
        expect(PopoverContent).toBeDefined();
    });
    it('exports Popover', () => {
        expect(Popover).toBeDefined();
    });
    it('exports PopoverTrigger', () => {
        expect(PopoverTrigger).toBeDefined();
    });
});
