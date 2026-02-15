/**
 * Export Service
 * Core export functionality for PDF, Excel, and CSV
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { chartExporter } from '@/utils/chartExporter';
import type { PDFExportOptions, ExcelExportOptions, CSVExportOptions } from '@/types/export';

export const exportService = {
    /**
     * Export data to PDF
     */
    async exportToPDF(
        data: any[],
        charts: { title: string; image: string }[],
        options: PDFExportOptions
    ): Promise<Blob> {
        const doc = new jsPDF({
            orientation: options.orientation || 'portrait',
            unit: 'mm',
            format: options.pageSize || 'a4'
        });

        let yPosition = 20;

        // Add title
        if (options.title) {
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(options.title, 105, yPosition, { align: 'center' });
            yPosition += 10;
        }

        // Add subtitle
        if (options.subtitle) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(options.subtitle, 105, yPosition, { align: 'center' });
            yPosition += 10;
        }

        // Add metadata
        if (options.author) {
            doc.setProperties({ author: options.author });
        }
        if (options.subject) {
            doc.setProperties({ subject: options.subject });
        }

        yPosition += 10;

        // Add charts
        if (options.includeCharts && charts.length > 0) {
            for (const chart of charts) {
                // Check if we need a new page
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }

                // Add chart title
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text(chart.title, 20, yPosition);
                yPosition += 10;

                // Add chart image
                try {
                    doc.addImage(chart.image, 'PNG', 20, yPosition, 170, 100);
                    yPosition += 110;
                } catch (error) {
                    console.error('Failed to add chart image:', error);
                }
            }
        }

        // Add data table
        if (options.includeData && data.length > 0) {
            if (yPosition > 200) {
                doc.addPage();
                yPosition = 20;
            }

            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Data Table', 20, yPosition);
            yPosition += 10;

            const columns = Object.keys(data[0]).map(key => ({
                header: key,
                dataKey: key
            }));

            autoTable(doc, {
                startY: yPosition,
                columns,
                body: data,
                headStyles: { fillColor: [66, 139, 202] },
                alternateRowStyles: { fillColor: [245, 245, 245] }
            });
        }

        // Add footer
        if (options.footerText) {
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    options.footerText,
                    105,
                    doc.internal.pageSize.height - 10,
                    { align: 'center' }
                );
            }
        }

        return doc.output('blob');
    },

    /**
     * Export data to Excel
     */
    async exportToExcel(
        sheets: { name: string; data: any[]; charts?: { title: string; image: string }[] }[],
        options: ExcelExportOptions
    ): Promise<Blob> {
        const workbook = new ExcelJS.Workbook();

        workbook.creator = 'ProjectOye Analytics';
        workbook.created = new Date();

        for (const sheet of sheets) {
            const worksheet = workbook.addWorksheet(sheet.name);

            if (sheet.data.length > 0) {
                // Add headers
                const headers = Object.keys(sheet.data[0]);
                worksheet.addRow(headers);

                // Style header row
                const headerRow = worksheet.getRow(1);
                headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                headerRow.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF428BCA' }
                };
                headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

                // Add data rows
                sheet.data.forEach(row => {
                    const values = headers.map(header => row[header]);
                    worksheet.addRow(values);
                });

                // Auto-fit columns
                worksheet.columns.forEach((column, index) => {
                    let maxLength = headers[index].length;
                    sheet.data.forEach(row => {
                        const value = row[headers[index]];
                        const length = value ? value.toString().length : 0;
                        if (length > maxLength) maxLength = length;
                    });
                    column.width = Math.min(maxLength + 2, 50);
                });

                // Add auto filter
                if (options.autoFilter) {
                    worksheet.autoFilter = {
                        from: { row: 1, column: 1 },
                        to: { row: 1, column: headers.length }
                    };
                }

                // Freeze header row
                if (options.freezeHeader) {
                    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
                }

                // Add charts as images
                if (options.includeCharts && sheet.charts) {
                    let imageRow = sheet.data.length + 3;
                    for (const chart of sheet.charts) {
                        try {
                            const imageId = workbook.addImage({
                                base64: chart.image.split(',')[1],
                                extension: 'png'
                            });

                            worksheet.addImage(imageId, {
                                tl: { col: 0, row: imageRow },
                                ext: { width: 600, height: 350 }
                            });

                            imageRow += 20; // Space for next chart
                        } catch (error) {
                            console.error('Failed to add chart to Excel:', error);
                        }
                    }
                }
            }
        }

        const buffer = await workbook.xlsx.writeBuffer();
        return new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
    },

    /**
     * Export data to CSV
     */
    async exportToCSV(data: any[], options: CSVExportOptions): Promise<Blob> {
        if (data.length === 0) {
            throw new Error('No data to export');
        }

        const delimiter = options.delimiter || ',';
        const headers = Object.keys(data[0]);

        let csv = '';

        // Add headers
        if (options.includeHeaders !== false) {
            csv += headers.join(delimiter) + '\n';
        }

        // Add data rows
        data.forEach(row => {
            const values = headers.map(header => {
                let value = row[header];
                // Escape quotes and wrap in quotes if contains delimiter
                if (value && typeof value === 'string') {
                    value = value.replace(/"/g, '""');
                    if (value.includes(delimiter) || value.includes('\n')) {
                        value = `"${value}"`;
                    }
                }
                return value ?? '';
            });
            csv += values.join(delimiter) + '\n';
        });

        return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    },

    /**
     * Download a file
     */
    downloadFile(blob: Blob, filename: string): void {
        saveAs(blob, filename);
    },

    /**
     * Email a report (requires backend integration)
     */
    async emailReport(
        file: Blob,
        recipients: string[],
        subject: string,
        message?: string
    ): Promise<void> {
        // This would typically call a backend API endpoint
        // For now, we'll just log it
        console.log('Email report:', {
            recipients,
            subject,
            message,
            fileSize: file.size
        });

        // TODO: Implement actual email sending via backend API
        // Example:
        // const formData = new FormData();
        // formData.append('file', file);
        // formData.append('recipients', JSON.stringify(recipients));
        // formData.append('subject', subject);
        // formData.append('message', message || '');
        // await fetch('/api/send-report-email', { method: 'POST', body: formData });

        throw new Error('Email delivery not yet implemented');
    }
};
