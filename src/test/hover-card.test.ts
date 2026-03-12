/**
 * hover-card Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { HoverCardContent, HoverCard, HoverCardTrigger } from '@/components/ui/hover-card';

describe('hover-card', () => {
    it('exports HoverCardContent', () => {
        expect(HoverCardContent).toBeDefined();
    });
    it('exports HoverCard', () => {
        expect(HoverCard).toBeDefined();
    });
    it('exports HoverCardTrigger', () => {
        expect(HoverCardTrigger).toBeDefined();
    });
});
