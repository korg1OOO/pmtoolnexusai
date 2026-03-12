/**
 * Chart Exporter Utility
 * Convert chart elements to images for export
 */

import html2canvas from 'html2canvas';
import type { ChartExportOptions } from '@/types/export';

const DEFAULT_OPTIONS: ChartExportOptions = {
    format: 'png',
    quality: 0.95,
    backgroundColor: '#ffffff',
    scale: 2 // For high DPI displays
};

export const chartExporter = {
    /**
     * Convert a single chart element to image
     */
    async exportChartToImage(
        element: HTMLElement,
        options: Partial<ChartExportOptions> = {}
    ): Promise<string> {
        const opts = { ...DEFAULT_OPTIONS, ...options };

        try {
            const canvas = await html2canvas(element, {
                backgroundColor: opts.backgroundColor,
                scale: opts.scale,
                logging: false,
                width: opts.width,
                height: opts.height,
                useCORS: true,
                allowTaint: true
            });

            return canvas.toDataURL(
                opts.format === 'jpeg' ? 'image/jpeg' : 'image/png',
                opts.quality
            );
        } catch (error) {
            console.error('Failed to export chart:', error);
            throw new Error('Chart export failed');
        }
    },

    /**
     * Export multiple charts to images
     */
    async exportChartsToImages(
        elements: HTMLElement[],
        options: Partial<ChartExportOptions> = {}
    ): Promise<string[]> {
        const promises = elements.map(element =>
            this.exportChartToImage(element, options)
        );
        return Promise.all(promises);
    },

    /**
     * Find all chart elements in a container
     */
    findChartElements(container: HTMLElement): HTMLElement[] {
        const charts: HTMLElement[] = [];

        // Find Recharts containers
        const rechartsElements = container.querySelectorAll('.recharts-wrapper');
        rechartsElements.forEach(el => charts.push(el as HTMLElement));

        // Find Chart.js containers
        const chartjsElements = container.querySelectorAll('canvas[class*="chartjs"]');
        chartjsElements.forEach(el => {
            const parent = el.parentElement;
            if (parent) charts.push(parent);
        });

        // Find custom chart containers (with data-chart attribute)
        const customCharts = container.querySelectorAll('[data-chart]');
        customCharts.forEach(el => charts.push(el as HTMLElement));

        return charts;
    },

    /**
     * Export all charts in a container
     */
    async exportAllChartsInContainer(
        container: HTMLElement,
        options: Partial<ChartExportOptions> = {}
    ): Promise<{ element: HTMLElement; image: string }[]> {
        const chartElements = this.findChartElements(container);
        const images = await this.exportChartsToImages(chartElements, options);

        return chartElements.map((element, index) => ({
            element,
            image: images[index]
        }));
    },

    /**
     * Convert data URL to Blob
     */
    dataURLtoBlob(dataURL: string): Blob {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
};
