/**
 * lib/utils — Deep Tests
 * Tests the cn() utility function for className merging
 */
import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('cn (className utility)', () => {
    it('merges multiple class strings', () => {
        const result = cn('foo', 'bar');
        expect(result).toBe('foo bar');
    });

    it('handles conditional classes', () => {
        const result = cn('base', true && 'active', false && 'hidden');
        expect(result).toBe('base active');
    });

    it('handles undefined and null values', () => {
        const result = cn('base', undefined, null, 'extra');
        expect(result).toBe('base extra');
    });

    it('handles empty string', () => {
        const result = cn('');
        expect(result).toBe('');
    });

    it('handles no arguments', () => {
        const result = cn();
        expect(result).toBe('');
    });

    it('merges tailwind classes and deduplicates', () => {
        const result = cn('px-2 py-1', 'px-4');
        expect(result).toBe('py-1 px-4');
    });

    it('handles array inputs', () => {
        const result = cn(['foo', 'bar']);
        expect(result).toBe('foo bar');
    });

    it('handles object inputs', () => {
        const result = cn({ foo: true, bar: false, baz: true });
        expect(result).toBe('foo baz');
    });
});
