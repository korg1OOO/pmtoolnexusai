/**
 * collapsible Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

describe('collapsible', () => {
    it('exports Collapsible', () => {
        expect(Collapsible).toBeDefined();
    });
    it('exports CollapsibleTrigger', () => {
        expect(CollapsibleTrigger).toBeDefined();
    });
    it('exports CollapsibleContent', () => {
        expect(CollapsibleContent).toBeDefined();
    });
});
