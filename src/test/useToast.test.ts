/**
 * use-toast Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({
    toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

import { toast, useToast } from '@/hooks/use-toast';
import { toast as sonnerToast } from 'sonner';

describe('use-toast', () => {
    describe('toast function', () => {
        it('calls sonner for default variant', () => {
            toast({ title: 'Hello', description: 'World' });
            expect(sonnerToast).toHaveBeenCalledWith('Hello', { description: 'World', duration: undefined });
        });

        it('calls sonner.error for destructive variant', () => {
            toast({ title: 'Error', variant: 'destructive' });
            expect(sonnerToast.error).toHaveBeenCalledWith('Error', { description: undefined, duration: undefined });
        });

        it('handles empty title', () => {
            toast({ description: 'desc' });
            expect(sonnerToast).toHaveBeenCalledWith('', expect.objectContaining({ description: 'desc' }));
        });
    });

    describe('useToast hook', () => {
        it('returns toast function', () => {
            const result = useToast();
            expect(result).toHaveProperty('toast');
            expect(typeof result.toast).toBe('function');
        });
    });
});
