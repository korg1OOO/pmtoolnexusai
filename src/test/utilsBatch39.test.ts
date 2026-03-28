/**
 * Tests batch 39: chartExporter dataURLtoBlob (pure) + cn utility + workspaceService module
 */
import { describe, it, expect, vi } from 'vitest';

// Mock html2canvas for chartExporter
vi.mock('html2canvas', () => ({ default: vi.fn() }));
vi.mock('@/types/export', () => ({}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({ select: vi.fn().mockReturnThis(), insert: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), single: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockReturnThis(), then: (r: any) => Promise.resolve({ data: null, error: null }).then(r) })),
        rpc: vi.fn(() => Promise.resolve({ data: null, error: null })),
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
    },
}));

import { chartExporter } from '@/utils/chartExporter';
import { cn } from '@/lib/utils';

describe('chartExporter', () => {
    it('exports chartExporter object', () => {
        expect(chartExporter).toBeDefined();
    });

    it('has exportChartToImage method', () => {
        expect(typeof chartExporter.exportChartToImage).toBe('function');
    });

    it('has exportChartsToImages method', () => {
        expect(typeof chartExporter.exportChartsToImages).toBe('function');
    });

    it('has findChartElements method', () => {
        expect(typeof chartExporter.findChartElements).toBe('function');
    });

    it('has dataURLtoBlob method', () => {
        expect(typeof chartExporter.dataURLtoBlob).toBe('function');
    });

    it('dataURLtoBlob converts PNG data URL', () => {
        const dataURL = 'data:image/png;base64,iVBORw0KGgo=';
        const blob = chartExporter.dataURLtoBlob(dataURL);
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/png');
    });

    it('dataURLtoBlob converts JPEG data URL', () => {
        const dataURL = 'data:image/jpeg;base64,/9j/4AAQ';
        const blob = chartExporter.dataURLtoBlob(dataURL);
        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe('image/jpeg');
    });
});

describe('cn utility', () => {
    it('merges class names', () => {
        const result = cn('foo', 'bar');
        expect(result).toContain('foo');
        expect(result).toContain('bar');
    });

    it('handles empty args', () => {
        const result = cn();
        expect(typeof result).toBe('string');
    });

    it('handles conditional classes', () => {
        const result = cn('base', false && 'hidden', 'other');
        expect(result).toContain('base');
        expect(result).toContain('other');
        expect(result).not.toContain('hidden');
    });

    it('deduplicates tailwind classes', () => {
        const result = cn('p-4', 'p-8');
        // twMerge should keep only the last one
        expect(result).toContain('p-8');
        expect(result).not.toContain('p-4');
    });
});

describe('workspaceService module', () => {
    it('imports successfully', async () => {
        const m = await import('@/services/workspaceService');
        expect(m).toBeDefined();
    });
    it('exports functions', async () => {
        const m = await import('@/services/workspaceService');
        const fns = Object.values(m).filter(v => typeof v === 'function');
        expect(fns.length).toBeGreaterThan(0);
    });
});
