/**
 * sheet Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { SheetOverlay, SheetContent, SheetTitle, SheetDescription, Sheet, SheetClose, SheetFooter, SheetHeader, SheetPortal, SheetTrigger } from '@/components/ui/sheet';

describe('sheet', () => {
    it('exports SheetOverlay', () => {
        expect(SheetOverlay).toBeDefined();
    });
    it('exports SheetContent', () => {
        expect(SheetContent).toBeDefined();
    });
    it('exports SheetTitle', () => {
        expect(SheetTitle).toBeDefined();
    });
    it('exports SheetDescription', () => {
        expect(SheetDescription).toBeDefined();
    });
    it('exports Sheet', () => {
        expect(Sheet).toBeDefined();
    });
    it('exports SheetClose', () => {
        expect(SheetClose).toBeDefined();
    });
    it('exports SheetFooter', () => {
        expect(SheetFooter).toBeDefined();
    });
    it('exports SheetHeader', () => {
        expect(SheetHeader).toBeDefined();
    });
    it('exports SheetPortal', () => {
        expect(SheetPortal).toBeDefined();
    });
    it('exports SheetTrigger', () => {
        expect(SheetTrigger).toBeDefined();
    });
});
