/**
 * Utility tests batch 1: chartExporter (JSDOM-compatible), more utils
 */
import { describe, it, expect, vi } from 'vitest';

// Mock html2canvas before import
vi.mock('html2canvas', () => ({
    default: vi.fn(() => Promise.resolve({
        toDataURL: vi.fn((type: string, quality: number) => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg=='),
    })),
}));

import { chartExporter } from '@/utils/chartExporter';

describe('chartExporter', () => {
    describe('dataURLtoBlob', () => {
        it('converts png data URL', () => {
            const blob = chartExporter.dataURLtoBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('image/png');
        });

        it('converts jpeg data URL', () => {
            const blob = chartExporter.dataURLtoBlob('data:image/jpeg;base64,/9j/4AAQ');
            expect(blob.type).toBe('image/jpeg');
        });

        it('blob has non-zero size', () => {
            const blob = chartExporter.dataURLtoBlob('data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==');
            expect(blob.size).toBeGreaterThan(0);
        });
    });

    describe('findChartElements', () => {
        it('finds recharts elements', () => {
            const container = document.createElement('div');
            const recharts = document.createElement('div');
            recharts.className = 'recharts-wrapper';
            container.appendChild(recharts);
            expect(chartExporter.findChartElements(container)).toHaveLength(1);
        });

        it('finds data-chart elements', () => {
            const container = document.createElement('div');
            const chart = document.createElement('div');
            chart.setAttribute('data-chart', 'bar');
            container.appendChild(chart);
            expect(chartExporter.findChartElements(container)).toHaveLength(1);
        });

        it('returns empty for no charts', () => {
            const container = document.createElement('div');
            container.textContent = 'No charts';
            expect(chartExporter.findChartElements(container)).toHaveLength(0);
        });

        it('finds multiple chart types', () => {
            const container = document.createElement('div');
            const r = document.createElement('div');
            r.className = 'recharts-wrapper';
            container.appendChild(r);
            const d = document.createElement('div');
            d.setAttribute('data-chart', 'line');
            container.appendChild(d);
            expect(chartExporter.findChartElements(container)).toHaveLength(2);
        });
    });

    describe('exportChartToImage', () => {
        it('returns data URL', async () => {
            const el = document.createElement('div');
            const r = await chartExporter.exportChartToImage(el);
            expect(r).toContain('data:image');
        });

        it('accepts options', async () => {
            const el = document.createElement('div');
            const r = await chartExporter.exportChartToImage(el, { format: 'jpeg', quality: 0.8 });
            expect(r).toBeDefined();
        });
    });

    describe('exportChartsToImages', () => {
        it('exports multiple', async () => {
            const els = [document.createElement('div'), document.createElement('div')];
            const r = await chartExporter.exportChartsToImages(els);
            expect(r).toHaveLength(2);
        });

        it('empty input', async () => {
            expect(await chartExporter.exportChartsToImages([])).toHaveLength(0);
        });
    });
});
