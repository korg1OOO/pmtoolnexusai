/**
 * Utility functions for chart data processing
 */

import type { ChartDataRange, ProcessedChartData, ChartType } from './types';

/**
 * Extract data from spreadsheet range
 */
export function extractChartData(
    data: any[][],
    range: ChartDataRange
): { headers: string[]; rows: any[][] } {
    const { startRow, endRow, startCol, endCol } = range;

    const headers: string[] = [];
    const rows: any[][] = [];

    // Extract headers from first row
    for (let col = startCol; col <= endCol; col++) {
        headers.push(data[startRow]?.[col]?.toString() || `Column ${col + 1}`);
    }

    // Extract data rows
    for (let row = startRow + 1; row <= endRow; row++) {
        const rowData: any[] = [];
        for (let col = startCol; col <= endCol; col++) {
            rowData.push(data[row]?.[col] || 0);
        }
        rows.push(rowData);
    }

    return { headers, rows };
}

/**
 * Process chart data for Recharts format
 */
export function processChartData(
    data: any[][],
    range: ChartDataRange,
    chartType: ChartType
): ProcessedChartData {
    const { headers, rows } = extractChartData(data, range);

    if (chartType === 'pie') {
        // Pie chart: First column is labels, second is values
        const pieData = rows.map((row) => ({
            name: row[0]?.toString() || '',
            value: parseFloat(row[1]) || 0,
        }));
        return { pieData };
    }

    if (chartType === 'scatter') {
        // Scatter: First column is X, second is Y
        const scatterData = rows.map((row, idx) => ({
            x: parseFloat(row[0]) || idx,
            y: parseFloat(row[1]) || 0,
            name: row[2]?.toString(),
        }));
        return { scatterData };
    }

    // Line, Bar, Area charts: First column is X-axis labels
    const chartData = rows.map((row) => {
        const dataPoint: any = { name: row[0]?.toString() || '' };

        // Add all other columns as series
        for (let i = 1; i < headers.length; i++) {
            dataPoint[headers[i]] = parseFloat(row[i]) || 0;
        }

        return dataPoint;
    });

    const seriesNames = headers.slice(1);

    return { chartData, seriesNames };
}

/**
 * Generate unique chart ID
 */
export function generateChartId(): string {
    return `chart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validate chart data range
 */
export function validateChartRange(
    range: ChartDataRange,
    maxRows: number,
    maxCols: number
): { valid: boolean; error?: string } {
    if (range.startRow < 0 || range.endRow >= maxRows) {
        return { valid: false, error: 'Row range is out of bounds' };
    }

    if (range.startCol < 0 || range.endCol >= maxCols) {
        return { valid: false, error: 'Column range is out of bounds' };
    }

    if (range.startRow >= range.endRow) {
        return { valid: false, error: 'Start row must be before end row' };
    }

    if (range.startCol >= range.endCol) {
        return { valid: false, error: 'Start column must be before end column' };
    }

    // Need at least 2 rows (header + 1 data row)
    if (range.endRow - range.startRow < 1) {
        return { valid: false, error: 'Need at least 2 rows (header + data)' };
    }

    return { valid: true };
}

/**
 * Format number for chart display
 */
export function formatChartValue(value: number, decimals: number = 2): string {
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    });
}

/**
 * Get chart display name
 */
export function getChartTypeName(type: ChartType): string {
    const names: Record<ChartType, string> = {
        line: 'Line Chart',
        bar: 'Bar Chart',
        pie: 'Pie Chart',
        area: 'Area Chart',
        scatter: 'Scatter Plot',
    };
    return names[type];
}
