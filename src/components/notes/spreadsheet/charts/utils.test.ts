/**
 * Deep tests for spreadsheet chart utils (144 lines, 6 pure functions)
 * Tests: extractChartData, processChartData, validateChartRange, formatChartValue, getChartTypeName, generateChartId
 */
import { describe, it, expect } from 'vitest';
import { extractChartData, processChartData, validateChartRange, formatChartValue, getChartTypeName, generateChartId } from './utils';

// Sample spreadsheet data
const sampleData = [
    ['Month', 'Sales', 'Revenue'],
    ['Jan', 100, 1000],
    ['Feb', 150, 1500],
    ['Mar', 200, 2000],
    ['Apr', 120, 1200],
];

const defaultRange = { startRow: 0, endRow: 4, startCol: 0, endCol: 2 };

// =================== extractChartData ===================
describe('extractChartData', () => {
    it('extracts headers from first row', () => {
        const { headers } = extractChartData(sampleData, defaultRange);
        expect(headers).toEqual(['Month', 'Sales', 'Revenue']);
    });

    it('extracts data rows (excluding header)', () => {
        const { rows } = extractChartData(sampleData, defaultRange);
        expect(rows).toHaveLength(4);
        expect(rows[0]).toEqual(['Jan', 100, 1000]);
        expect(rows[3]).toEqual(['Apr', 120, 1200]);
    });

    it('handles partial range', () => {
        const range = { startRow: 0, endRow: 2, startCol: 0, endCol: 1 };
        const { headers, rows } = extractChartData(sampleData, range);
        expect(headers).toEqual(['Month', 'Sales']);
        expect(rows).toHaveLength(2);
    });

    it('handles missing data with fallback', () => {
        const sparseData = [
            ['A', 'B'],
            [undefined, null],
        ];
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 1 };
        const { rows } = extractChartData(sparseData, range);
        expect(rows[0]).toEqual([0, 0]); // fallback to 0
    });

    it('handles missing headers with Column X fallback', () => {
        const data = [[undefined, null], [1, 2]];
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 1 };
        const { headers } = extractChartData(data, range);
        expect(headers[0]).toBe('Column 1');
        expect(headers[1]).toBe('Column 2');
    });
});

// =================== processChartData ===================
describe('processChartData', () => {
    it('processes bar/line/area chart data', () => {
        const result = processChartData(sampleData, defaultRange, 'bar');
        expect(result.chartData).toHaveLength(4);
        expect(result.chartData![0].name).toBe('Jan');
        expect(result.chartData![0].Sales).toBe(100);
        expect(result.chartData![0].Revenue).toBe(1000);
        expect(result.seriesNames).toEqual(['Sales', 'Revenue']);
    });

    it('processes pie chart data', () => {
        const result = processChartData(sampleData, defaultRange, 'pie');
        expect(result.pieData).toHaveLength(4);
        expect(result.pieData![0].name).toBe('Jan');
        expect(result.pieData![0].value).toBe(100);
    });

    it('processes scatter chart data', () => {
        const scatterData = [
            ['X', 'Y', 'Label'],
            [1, 10, 'A'],
            [2, 20, 'B'],
        ];
        const range = { startRow: 0, endRow: 2, startCol: 0, endCol: 2 };
        const result = processChartData(scatterData, range, 'scatter');
        expect(result.scatterData).toHaveLength(2);
        expect(result.scatterData![0].x).toBe(1);
        expect(result.scatterData![0].y).toBe(10);
        expect(result.scatterData![0].name).toBe('A');
    });

    it('handles line chart type', () => {
        const result = processChartData(sampleData, defaultRange, 'line');
        expect(result.chartData).toHaveLength(4);
        expect(result.seriesNames).toEqual(['Sales', 'Revenue']);
    });

    it('handles area chart type', () => {
        const result = processChartData(sampleData, defaultRange, 'area');
        expect(result.chartData).toBeDefined();
        expect(result.seriesNames).toBeDefined();
    });

    it('parses numeric strings', () => {
        const data = [['X', 'Y'], ['A', '123.45']];
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 1 };
        const result = processChartData(data, range, 'bar');
        expect(result.chartData![0].Y).toBe(123.45);
    });

    it('defaults NaN to 0', () => {
        const data = [['X', 'Y'], ['A', 'not-a-number']];
        const range = { startRow: 0, endRow: 1, startCol: 0, endCol: 1 };
        const result = processChartData(data, range, 'bar');
        expect(result.chartData![0].Y).toBe(0);
    });
});

// =================== validateChartRange ===================
describe('validateChartRange', () => {
    it('valid range', () => {
        const r = validateChartRange({ startRow: 0, endRow: 4, startCol: 0, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(true);
    });

    it('row out of bounds', () => {
        const r = validateChartRange({ startRow: 0, endRow: 15, startCol: 0, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Row range');
    });

    it('negative start row', () => {
        const r = validateChartRange({ startRow: -1, endRow: 5, startCol: 0, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(false);
    });

    it('column out of bounds', () => {
        const r = validateChartRange({ startRow: 0, endRow: 4, startCol: 0, endCol: 15 }, 10, 10);
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Column range');
    });

    it('start row >= end row', () => {
        const r = validateChartRange({ startRow: 5, endRow: 5, startCol: 0, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Start row');
    });

    it('start col >= end col', () => {
        const r = validateChartRange({ startRow: 0, endRow: 4, startCol: 3, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(false);
        expect(r.error).toContain('Start column');
    });

    it('needs at least 2 rows', () => {
        const r = validateChartRange({ startRow: 0, endRow: 0, startCol: 0, endCol: 2 }, 10, 10);
        expect(r.valid).toBe(false);
    });
});

// =================== formatChartValue ===================
describe('formatChartValue', () => {
    it('formats integer', () => {
        const r = formatChartValue(1234);
        expect(r).toContain('1');
        expect(r).toContain('234');
    });

    it('formats decimal with default 2 places', () => {
        const r = formatChartValue(123.456);
        expect(r).toContain('123');
    });

    it('custom decimal places', () => {
        const r = formatChartValue(1.5, 0);
        expect(r).toBe('2'); // rounded
    });

    it('zero', () => {
        expect(formatChartValue(0)).toBe('0');
    });

    it('negative number', () => {
        const r = formatChartValue(-500);
        expect(r).toContain('500');
    });
});

// =================== getChartTypeName ===================
describe('getChartTypeName', () => {
    it('line', () => { expect(getChartTypeName('line')).toBe('Line Chart'); });
    it('bar', () => { expect(getChartTypeName('bar')).toBe('Bar Chart'); });
    it('pie', () => { expect(getChartTypeName('pie')).toBe('Pie Chart'); });
    it('area', () => { expect(getChartTypeName('area')).toBe('Area Chart'); });
    it('scatter', () => { expect(getChartTypeName('scatter')).toBe('Scatter Plot'); });
});

// =================== generateChartId ===================
describe('generateChartId', () => {
    it('starts with chart-', () => {
        expect(generateChartId()).toMatch(/^chart-/);
    });

    it('generates unique IDs', () => {
        const id1 = generateChartId();
        const id2 = generateChartId();
        expect(id1).not.toBe(id2);
    });

    it('contains timestamp', () => {
        const id = generateChartId();
        const parts = id.split('-');
        const timestamp = parseInt(parts[1]);
        expect(timestamp).toBeGreaterThan(0);
    });
});
