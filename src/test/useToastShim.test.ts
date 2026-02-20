/**
 * use-toast shim tests.
 *
 * Verifies that the useToast() hook correctly delegates to Sonner
 * and that the toast() shim function maps variant → Sonner method.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock Sonner before importing our shim ──────────────────────────────────
vi.mock('sonner', () => {
    const toast = vi.fn() as any;
    toast.error = vi.fn();
    return { toast };
});

import { toast as sonnerToast } from 'sonner';
import { toast, useToast } from '@/hooks/use-toast';

describe('use-toast shim', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('toast()', () => {
        it('calls sonner toast() for default variant', () => {
            toast({ title: 'Hello', description: 'World' });
            expect(sonnerToast).toHaveBeenCalledWith('Hello', {
                description: 'World',
                duration: undefined,
            });
            expect(sonnerToast.error).not.toHaveBeenCalled();
        });

        it('calls sonner toast.error() for destructive variant', () => {
            toast({ title: 'Error!', description: 'Something broke', variant: 'destructive' });
            expect(sonnerToast.error).toHaveBeenCalledWith('Error!', {
                description: 'Something broke',
                duration: undefined,
            });
            expect(sonnerToast).not.toHaveBeenCalled();
        });

        it('uses empty string as title if omitted', () => {
            toast({ description: 'Only a description' });
            expect(sonnerToast).toHaveBeenCalledWith('', expect.objectContaining({
                description: 'Only a description',
            }));
        });

        it('passes duration through', () => {
            toast({ title: 'Quick', duration: 1500 });
            expect(sonnerToast).toHaveBeenCalledWith('Quick', expect.objectContaining({
                duration: 1500,
            }));
        });
    });

    describe('useToast()', () => {
        it('returns a toast function', () => {
            const { toast: hookToast } = useToast();
            expect(typeof hookToast).toBe('function');
        });

        it('toast from useToast() delegates to sonner', () => {
            const { toast: hookToast } = useToast();
            hookToast({ title: 'Via hook' });
            expect(sonnerToast).toHaveBeenCalledWith('Via hook', expect.anything());
        });
    });
});
