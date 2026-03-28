/**
 * Tests for lib/utils cn() function — Tailwind class merging utility
 */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (lib/utils)', () => {
    it('merges single class', () => {
        expect(cn('bg-red-500')).toBe('bg-red-500');
    });

    it('merges multiple classes', () => {
        const r = cn('p-4', 'text-white');
        expect(r).toContain('p-4');
        expect(r).toContain('text-white');
    });

    it('handles conditional classes', () => {
        const r = cn('base', false && 'hidden', true && 'visible');
        expect(r).toContain('base');
        expect(r).toContain('visible');
        expect(r).not.toContain('hidden');
    });

    it('merges conflicting tailwind classes (last wins)', () => {
        const r = cn('p-4', 'p-8');
        expect(r).toBe('p-8');
    });

    it('handles undefined and null', () => {
        const r = cn('base', undefined, null);
        expect(r).toBe('base');
    });

    it('empty args', () => {
        expect(cn()).toBe('');
    });

    it('array of classes', () => {
        const r = cn(['p-4', 'text-sm']);
        expect(r).toContain('p-4');
        expect(r).toContain('text-sm');
    });

    it('complex merge — color variants', () => {
        const r = cn('bg-blue-500', 'bg-red-500');
        expect(r).toBe('bg-red-500');
    });

    it('preserves non-conflicting classes', () => {
        const r = cn('rounded-lg', 'shadow-md', 'p-4', 'text-sm');
        expect(r).toContain('rounded-lg');
        expect(r).toContain('shadow-md');
        expect(r).toContain('p-4');
        expect(r).toContain('text-sm');
    });
});
