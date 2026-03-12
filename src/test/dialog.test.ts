/**
 * dialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { DialogOverlay, DialogContent, DialogTitle, DialogDescription, Dialog, DialogPortal, DialogClose, DialogTrigger, DialogHeader, DialogFooter } from '@/components/ui/dialog';

describe('dialog', () => {
    it('exports DialogOverlay', () => {
        expect(DialogOverlay).toBeDefined();
    });
    it('exports DialogContent', () => {
        expect(DialogContent).toBeDefined();
    });
    it('exports DialogTitle', () => {
        expect(DialogTitle).toBeDefined();
    });
    it('exports DialogDescription', () => {
        expect(DialogDescription).toBeDefined();
    });
    it('exports Dialog', () => {
        expect(Dialog).toBeDefined();
    });
    it('exports DialogPortal', () => {
        expect(DialogPortal).toBeDefined();
    });
    it('exports DialogClose', () => {
        expect(DialogClose).toBeDefined();
    });
    it('exports DialogTrigger', () => {
        expect(DialogTrigger).toBeDefined();
    });
    it('exports DialogHeader', () => {
        expect(DialogHeader).toBeDefined();
    });
    it('exports DialogFooter', () => {
        expect(DialogFooter).toBeDefined();
    });
});
