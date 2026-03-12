/**
 * tooltip Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { TooltipContent, Tooltip, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

describe('tooltip', () => {
    it('exports TooltipContent', () => {
        expect(TooltipContent).toBeDefined();
    });
    it('exports Tooltip', () => {
        expect(Tooltip).toBeDefined();
    });
    it('exports TooltipTrigger', () => {
        expect(TooltipTrigger).toBeDefined();
    });
    it('exports TooltipProvider', () => {
        expect(TooltipProvider).toBeDefined();
    });
});
