/**
 * accordion Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { AccordionItem, AccordionTrigger, AccordionContent, Accordion } from '@/components/ui/accordion';

describe('accordion', () => {
    it('exports AccordionItem', () => {
        expect(AccordionItem).toBeDefined();
    });
    it('exports AccordionTrigger', () => {
        expect(AccordionTrigger).toBeDefined();
    });
    it('exports AccordionContent', () => {
        expect(AccordionContent).toBeDefined();
    });
    it('exports Accordion', () => {
        expect(Accordion).toBeDefined();
    });
});
