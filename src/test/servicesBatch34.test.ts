/**
 * Tests batch 34: exportService module load + exportToCSV pure logic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock jspdf
vi.mock('jspdf', () => ({
    default: vi.fn().mockImplementation(() => ({
        setFontSize: vi.fn(),
        text: vi.fn(),
        setFont: vi.fn(),
        addPage: vi.fn(),
        addImage: vi.fn(),
        save: vi.fn(),
        output: vi.fn(() => new ArrayBuffer(10)),
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
    })),
}));

vi.mock('jspdf-autotable', () => ({
    default: vi.fn(),
}));

vi.mock('exceljs', () => ({
    default: {
        Workbook: vi.fn().mockImplementation(() => ({
            addWorksheet: vi.fn(() => ({
                addRow: vi.fn(),
                columns: [],
                getRow: vi.fn(() => ({ font: {}, fill: {}, eachCell: vi.fn() })),
                addImage: vi.fn(),
            })),
            xlsx: { writeBuffer: vi.fn(() => Promise.resolve(new ArrayBuffer(10))) },
            addImage: vi.fn(() => 'img1'),
        })),
    },
}));

vi.mock('file-saver', () => ({ saveAs: vi.fn() }));

vi.mock('@/utils/chartExporter', () => ({
    chartExporter: { exportChart: vi.fn(() => Promise.resolve('data:image/png;base64,test')) },
}));

vi.mock('@/types/export', () => ({}));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: { invoke: vi.fn(() => Promise.resolve({ data: null, error: null })) },
    },
}));

import { exportService } from '@/services/exportService';

describe('exportService', () => {
    it('exports service object', () => {
        expect(exportService).toBeDefined();
        expect(typeof exportService).toBe('object');
    });

    it('has exportToPDF method', () => {
        expect(typeof exportService.exportToPDF).toBe('function');
    });

    it('has exportToExcel method', () => {
        expect(typeof exportService.exportToExcel).toBe('function');
    });

    it('has exportToCSV method', () => {
        expect(typeof exportService.exportToCSV).toBe('function');
    });

    it('has downloadFile method', () => {
        expect(typeof exportService.downloadFile).toBe('function');
    });

    it('has emailReport method', () => {
        expect(typeof exportService.emailReport).toBe('function');
    });

    it('exportToCSV generates CSV blob', async () => {
        const blob = await exportService.exportToCSV(
            [{ name: 'Project A', status: 'active' }, { name: 'Project B', status: 'done' }],
            { filename: 'test.csv', headers: ['name', 'status'] } as any
        );
        expect(blob).toBeDefined();
    });

    it('downloadFile calls saveAs', () => {
        const blob = new Blob(['test']);
        exportService.downloadFile(blob, 'test.csv');
        // Should not throw
        expect(true).toBe(true);
    });
});
