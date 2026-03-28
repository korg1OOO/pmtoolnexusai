/**
 * Deep tests for PivotTableEngine (268 lines, pure class, no external deps)
 * Tests: generate, aggregate, filtering, row/column/grand totals
 */
import { describe, it, expect } from 'vitest';
import { PivotTableEngine } from './PivotTableEngine';
import type { PivotTableConfig, ValueField } from './types';

// Helper: minimal config
function makeConfig(overrides: Partial<PivotTableConfig> = {}): PivotTableConfig {
    return {
        id: 'pivot-1',
        name: 'Test Pivot',
        sourceRange: { startRow: 0, startCol: 0, endRow: 4, endCol: 2 },
        rows: ['Category'],
        columns: ['Region'],
        values: [{ column: 'Sales', aggregation: 'sum' }],
        filters: [],
        position: { x: 0, y: 0 },
        size: { width: 400, height: 300 },
        showGrandTotals: true,
        showSubtotals: true,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
        ...overrides,
    };
}

// Sample spreadsheet data: [Category, Region, Sales]
const sampleData = [
    ['Category', 'Region', 'Sales'],
    ['Electronics', 'North', 100],
    ['Electronics', 'South', 200],
    ['Clothing', 'North', 50],
    ['Clothing', 'South', 75],
];

describe('PivotTableEngine.generate', () => {
    it('generates pivot from source data', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result).toBeDefined();
        expect(result.headers.rows.length).toBeGreaterThan(0);
        expect(result.data).toBeInstanceOf(Map);
    });

    it('has correct row keys', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        const rowKeys = result.headers.rows;
        expect(rowKeys).toContain('Electronics');
        expect(rowKeys).toContain('Clothing');
    });

    it('has correct column keys', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        const colKeys = result.headers.columns[0];
        expect(colKeys).toContain('North');
        expect(colKeys).toContain('South');
    });

    it('aggregates SUM correctly', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        // Electronics | North = 100, Electronics | South = 200
        const electronicsRow = result.data.get('Electronics');
        expect(electronicsRow).toBeDefined();
        const northVal = electronicsRow?.get('North');
        expect(northVal?.Sales).toBe(100);
        const southVal = electronicsRow?.get('South');
        expect(southVal?.Sales).toBe(200);
    });

    it('calculates row totals', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result.rowTotals).toBeDefined();
        // Electronics total = 100 + 200 = 300
        const electronicsTotal = result.rowTotals?.get('Electronics');
        expect(electronicsTotal?.Sales).toBe(300);
    });

    it('calculates column totals', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result.columnTotals).toBeDefined();
        // North total = 100 + 50 = 150
        const northTotal = result.columnTotals?.get('North');
        expect(northTotal?.Sales).toBe(150);
    });

    it('calculates grand total', () => {
        const config = makeConfig();
        const result = PivotTableEngine.generate(sampleData, config);
        // Grand total = 100 + 200 + 50 + 75 = 425
        expect(result.grandTotal?.Sales).toBe(425);
    });
});

describe('PivotTableEngine.generate - aggregation types', () => {
    it('AVERAGE aggregation', () => {
        const config = makeConfig({
            values: [{ column: 'Sales', aggregation: 'average' }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        // Electronics North = 100 (only 1 value), avg = 100
        const electronicsRow = result.data.get('Electronics');
        expect(electronicsRow?.get('North')?.Sales).toBe(100);
    });

    it('COUNT aggregation', () => {
        const config = makeConfig({
            values: [{ column: 'Sales', aggregation: 'count' }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        // Electronics North has 1 row
        const electronicsRow = result.data.get('Electronics');
        expect(electronicsRow?.get('North')?.Sales).toBe(1);
    });

    it('MIN aggregation', () => {
        const config = makeConfig({
            values: [{ column: 'Sales', aggregation: 'min' }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        const clothingRow = result.data.get('Clothing');
        expect(clothingRow?.get('South')?.Sales).toBe(75);
    });

    it('MAX aggregation', () => {
        const config = makeConfig({
            values: [{ column: 'Sales', aggregation: 'max' }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        const electronicsRow = result.data.get('Electronics');
        expect(electronicsRow?.get('South')?.Sales).toBe(200);
    });

    it('COUNT-NUMBERS aggregation', () => {
        const config = makeConfig({
            values: [{ column: 'Sales', aggregation: 'count-numbers' }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        const electronicsRow = result.data.get('Electronics');
        expect(electronicsRow?.get('North')?.Sales).toBe(1);
    });
});

describe('PivotTableEngine.generate - filters', () => {
    it('include filter', () => {
        const config = makeConfig({
            filters: [{ column: 'Category', type: 'include', values: ['Electronics'] }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result.headers.rows).toContain('Electronics');
        expect(result.headers.rows).not.toContain('Clothing');
    });

    it('exclude filter', () => {
        const config = makeConfig({
            filters: [{ column: 'Category', type: 'exclude', values: ['Clothing'] }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result.headers.rows).toContain('Electronics');
        expect(result.headers.rows).not.toContain('Clothing');
    });

    it('empty filter array returns all data', () => {
        const config = makeConfig({ filters: [] });
        const result = PivotTableEngine.generate(sampleData, config);
        expect(result.headers.rows).toHaveLength(2);
    });
});

describe('PivotTableEngine.generate - edge cases', () => {
    it('handles blank values', () => {
        const dataWithBlanks = [
            ['Category', 'Region', 'Sales'],
            ['Electronics', '', 100],
            ['', 'North', 50],
        ];
        const config = makeConfig({ sourceRange: { startRow: 0, startCol: 0, endRow: 2, endCol: 2 } });
        const result = PivotTableEngine.generate(dataWithBlanks, config);
        // Blank values should map to '(Blank)'
        expect(result.headers.rows).toContain('(Blank)');
    });

    it('handles single row data', () => {
        const singleRow = [
            ['Category', 'Region', 'Sales'],
            ['A', 'X', 10],
        ];
        const config = makeConfig({ sourceRange: { startRow: 0, startCol: 0, endRow: 1, endCol: 2 } });
        const result = PivotTableEngine.generate(singleRow, config);
        expect(result.headers.rows).toHaveLength(1);
    });

    it('handles data with no matching filter column', () => {
        const config = makeConfig({
            filters: [{ column: 'NonExistent', type: 'include', values: ['X'] }],
        });
        const result = PivotTableEngine.generate(sampleData, config);
        // Filter column not found → all rows pass
        expect(result.headers.rows).toHaveLength(2);
    });

    it('multiple value fields', () => {
        const dataWithMultiple = [
            ['Category', 'Region', 'Sales', 'Quantity'],
            ['A', 'X', 100, 5],
            ['A', 'X', 200, 3],
        ];
        const config = makeConfig({
            sourceRange: { startRow: 0, startCol: 0, endRow: 2, endCol: 3 },
            values: [
                { column: 'Sales', aggregation: 'sum' },
                { column: 'Quantity', aggregation: 'sum' },
            ],
        });
        const result = PivotTableEngine.generate(dataWithMultiple, config);
        const row = result.data.get('A');
        expect(row?.get('X')?.Sales).toBe(300);
        expect(row?.get('X')?.Quantity).toBe(8);
    });
});
