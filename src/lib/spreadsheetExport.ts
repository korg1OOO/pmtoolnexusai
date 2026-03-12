import * as XLSX from 'xlsx';

/**
 * Export spreadsheet data to Excel format
 */
export function exportToExcel(
    data: any[][],
    sheetName: string,
    fileName: string,
    formats?: Record<string, any>
) {
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Apply cell formatting if provided
    if (formats && ws['!ref']) {
        const range = XLSX.utils.decode_range(ws['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            for (let C = range.s.c; C <= range.e.c; ++C) {
                const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                const format = formats[`${R}-${C}`];
                if (format && ws[cellRef]) {
                    ws[cellRef].s = {
                        font: {
                            bold: format.bold,
                            italic: format.italic,
                            underline: format.underline,
                        },
                        alignment: { horizontal: format.align },
                        fill: format.bgColor ? { fgColor: { rgb: format.bgColor.replace('#', '') } } : undefined,
                    };
                }
            }
        }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}

/**
 * Export spreadsheet data to CSV format
 */
export function exportToCSV(data: any[][], fileName: string) {
    const csv = data
        .map(row =>
            row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')
        )
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.csv`;
    link.click();
    URL.revokeObjectURL(url);
}
