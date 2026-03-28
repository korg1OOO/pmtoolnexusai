/**
 * scroll-area Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

describe('scroll-area', () => {
    it('exports ScrollArea', () => {
        expect(ScrollArea).toBeDefined();
    });
    it('exports ScrollBar', () => {
        expect(ScrollBar).toBeDefined();
    });
});
