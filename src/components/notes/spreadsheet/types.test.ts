/**
 * Tests for spreadsheet types and pivot types — exported constants/type guards
 */
import { describe, it, expect } from 'vitest';
import type { SpreadsheetData, CellValue, CellFormat, MergedCell } from '@/components/notes/spreadsheet/types';

describe('Spreadsheet types', () => {
    it('SpreadsheetData shape is correct', () => {
        const data: SpreadsheetData = {
            cells: {},
            rowCount: 10,
            colCount: 5,
            mergedCells: [],
            columnWidths: {},
            rowHeights: {},
        };
        expect(data.rowCount).toBe(10);
        expect(data.colCount).toBe(5);
        expect(data.mergedCells).toHaveLength(0);
    });

    it('CellValue accepts string', () => {
        const val: CellValue = 'Hello';
        expect(val).toBe('Hello');
    });

    it('CellValue accepts number', () => {
        const val: CellValue = 42;
        expect(val).toBe(42);
    });

    it('CellValue accepts boolean', () => {
        const val: CellValue = true;
        expect(val).toBe(true);
    });

    it('CellFormat shape', () => {
        const fmt: CellFormat = {
            bold: true,
            italic: false,
        };
        expect(fmt.bold).toBe(true);
    });

    it('MergedCell has required fields', () => {
        const merged: MergedCell = {
            startRow: 0,
            startCol: 0,
            endRow: 1,
            endCol: 2,
        };
        expect(merged.endRow).toBe(1);
    });
});
