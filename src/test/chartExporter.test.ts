/**
 * chartExporter — Deep Tests
 * Tests dataURLtoBlob pure function and findChartElements
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('html2canvas', () => ({ default: vi.fn() }));
vi.mock('@/types/export', () => ({}));

import { chartExporter } from '@/utils/chartExporter';

describe('chartExporter', () => {
    describe('dataURLtoBlob', () => {
        it('converts a PNG data URL to Blob', () => {
            const dataURL = 'data:image/png;base64,iVBORw0KGgo=';
            const blob = chartExporter.dataURLtoBlob(dataURL);
            expect(blob).toBeInstanceOf(Blob);
            expect(blob.type).toBe('image/png');
        });

        it('converts a JPEG data URL to Blob', () => {
            const dataURL = 'data:image/jpeg;base64,/9j/4AAQ';
            const blob = chartExporter.dataURLtoBlob(dataURL);
            expect(blob.type).toBe('image/jpeg');
        });

        it('returns non-zero size blob', () => {
            const dataURL = 'data:image/png;base64,iVBORw0KGgo=';
            const blob = chartExporter.dataURLtoBlob(dataURL);
            expect(blob.size).toBeGreaterThan(0);
        });

        it('defaults to image/png when mime is missing', () => {
            const dataURL = 'data:;base64,iVBORw0KGgo=';
            const blob = chartExporter.dataURLtoBlob(dataURL);
            expect(blob.type).toBe('image/png');
        });
    });

    describe('findChartElements', () => {
        it('returns empty array for empty container', () => {
            const container = document.createElement('div');
            const result = chartExporter.findChartElements(container);
            expect(result).toEqual([]);
        });

        it('finds recharts-wrapper elements', () => {
            const container = document.createElement('div');
            const chart = document.createElement('div');
            chart.className = 'recharts-wrapper';
            container.appendChild(chart);
            const result = chartExporter.findChartElements(container);
            expect(result).toHaveLength(1);
        });

        it('finds data-chart elements', () => {
            const container = document.createElement('div');
            const chart = document.createElement('div');
            chart.setAttribute('data-chart', 'pie');
            container.appendChild(chart);
            const result = chartExporter.findChartElements(container);
            expect(result).toHaveLength(1);
        });

        it('finds multiple chart types', () => {
            const container = document.createElement('div');
            const rc = document.createElement('div');
            rc.className = 'recharts-wrapper';
            const dc = document.createElement('div');
            dc.setAttribute('data-chart', 'bar');
            container.appendChild(rc);
            container.appendChild(dc);
            const result = chartExporter.findChartElements(container);
            expect(result).toHaveLength(2);
        });

        it('finds chartjs canvas parent elements', () => {
            const container = document.createElement('div');
            const parent = document.createElement('div');
            const canvas = document.createElement('canvas');
            canvas.className = 'chartjs-render-monitor';
            parent.appendChild(canvas);
            container.appendChild(parent);
            const result = chartExporter.findChartElements(container);
            expect(result).toHaveLength(1);
        });
    });

    describe('exportChartToImage', () => {
        it('is a function', () => {
            expect(typeof chartExporter.exportChartToImage).toBe('function');
        });
    });

    describe('exportChartsToImages', () => {
        it('is a function', () => {
            expect(typeof chartExporter.exportChartsToImages).toBe('function');
        });
    });
});
