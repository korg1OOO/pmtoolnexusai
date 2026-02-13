import html2canvas from 'html2canvas';

/**
 * Export a chart as PNG
 */
export async function exportChartAsPNG(chartId: string, chartTitle: string): Promise<void> {
    const element = document.getElementById(`chart-${chartId}`);

    if (!element) {
        console.error('Chart element not found');
        return;
    }

    try {
        const canvas = await html2canvas(element, {
            backgroundColor: '#ffffff',
            scale: 2, // Higher quality
        });

        const link = document.createElement('a');
        link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (error) {
        console.error('Failed to export chart as PNG:', error);
    }
}

/**
 * Export a chart as SVG
 */
export async function exportChartAsSVG(chartId: string, chartTitle: string): Promise<void> {
    const element = document.getElementById(`chart-${chartId}`);

    if (!element) {
        console.error('Chart element not found');
        return;
    }

    try {
        // Find the SVG element within the chart (Recharts renders to SVG)
        const svgElement = element.querySelector('svg');

        if (!svgElement) {
            console.error('SVG element not found in chart');
            return;
        }

        // Clone and serialize the SVG
        const clonedSvg = svgElement.cloneNode(true) as SVGElement;
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clonedSvg);

        // Create blob and download
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `${chartTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.svg`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to export chart as SVG:', error);
    }
}
