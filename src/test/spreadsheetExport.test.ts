/**
 * spreadsheetExport — Deep Tests
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

vi.mock('xlsx', () => ({
    utils: {
        aoa_to_sheet: vi.fn(() => ({ '!ref': 'A1:B2' })),
        decode_range: vi.fn(() => ({ s: { r: 0, c: 0 }, e: { r: 1, c: 1 } })),
        encode_cell: vi.fn(() => 'A1'),
        book_new: vi.fn(() => ({})),
        book_append_sheet: vi.fn(),
    },
    writeFile: vi.fn(),
}));

// Stub URL methods for jsdom
beforeAll(() => {
    if (!URL.createObjectURL) {
        (URL as any).createObjectURL = vi.fn(() => 'blob:test');
    }
    if (!URL.revokeObjectURL) {
        (URL as any).revokeObjectURL = vi.fn();
    }
});

import { exportToExcel, exportToCSV } from '@/lib/spreadsheetExport';

describe('spreadsheetExport', () => {
    describe('exportToExcel', () => {
        it('is a function', () => {
            expect(typeof exportToExcel).toBe('function');
        });

        it('does not throw with valid data', () => {
            expect(() => exportToExcel([['A', 'B'], [1, 2]], 'Sheet1', 'test')).not.toThrow();
        });

        it('handles formats parameter', () => {
            expect(() => exportToExcel([['A']], 'S', 'f', { '0-0': { bold: true } })).not.toThrow();
        });
    });

    describe('exportToCSV', () => {
        it('is a function', () => {
            expect(typeof exportToCSV).toBe('function');
        });

        it('does not throw with valid data', () => {
            expect(() => exportToCSV([['A'], ['B']], 'test')).not.toThrow();
        });
    });
});
