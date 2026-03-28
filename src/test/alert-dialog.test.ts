/**
 * alert-dialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel, AlertDialog, AlertDialogPortal, AlertDialogTrigger, AlertDialogHeader, AlertDialogFooter } from '@/components/ui/alert-dialog';

describe('alert-dialog', () => {
    it('exports AlertDialogOverlay', () => {
        expect(AlertDialogOverlay).toBeDefined();
    });
    it('exports AlertDialogContent', () => {
        expect(AlertDialogContent).toBeDefined();
    });
    it('exports AlertDialogTitle', () => {
        expect(AlertDialogTitle).toBeDefined();
    });
    it('exports AlertDialogDescription', () => {
        expect(AlertDialogDescription).toBeDefined();
    });
    it('exports AlertDialogAction', () => {
        expect(AlertDialogAction).toBeDefined();
    });
    it('exports AlertDialogCancel', () => {
        expect(AlertDialogCancel).toBeDefined();
    });
    it('exports AlertDialog', () => {
        expect(AlertDialog).toBeDefined();
    });
    it('exports AlertDialogPortal', () => {
        expect(AlertDialogPortal).toBeDefined();
    });
    it('exports AlertDialogTrigger', () => {
        expect(AlertDialogTrigger).toBeDefined();
    });
    it('exports AlertDialogHeader', () => {
        expect(AlertDialogHeader).toBeDefined();
    });
    it('exports AlertDialogFooter', () => {
        expect(AlertDialogFooter).toBeDefined();
    });
});
