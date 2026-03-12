/**
 * drawer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { DrawerOverlay, DrawerContent, DrawerTitle, DrawerDescription, Drawer, DrawerPortal, DrawerTrigger, DrawerClose, DrawerHeader, DrawerFooter } from '@/components/ui/drawer';

describe('drawer', () => {
    it('exports DrawerOverlay', () => {
        expect(DrawerOverlay).toBeDefined();
    });
    it('exports DrawerContent', () => {
        expect(DrawerContent).toBeDefined();
    });
    it('exports DrawerTitle', () => {
        expect(DrawerTitle).toBeDefined();
    });
    it('exports DrawerDescription', () => {
        expect(DrawerDescription).toBeDefined();
    });
    it('exports Drawer', () => {
        expect(Drawer).toBeDefined();
    });
    it('exports DrawerPortal', () => {
        expect(DrawerPortal).toBeDefined();
    });
    it('exports DrawerTrigger', () => {
        expect(DrawerTrigger).toBeDefined();
    });
    it('exports DrawerClose', () => {
        expect(DrawerClose).toBeDefined();
    });
    it('exports DrawerHeader', () => {
        expect(DrawerHeader).toBeDefined();
    });
    it('exports DrawerFooter', () => {
        expect(DrawerFooter).toBeDefined();
    });
});
