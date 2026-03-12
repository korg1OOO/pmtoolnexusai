/**
 * Export Types
 * Type definitions for export functionality
 */

import type { FilterState } from './analytics';

export interface ExportOptions {
    format: 'pdf' | 'excel' | 'csv';
    filename?: string;
    includeCharts?: boolean;
    includeData?: boolean;
    dateRange?: {
        start: Date;
        end: Date;
    };
    filters?: FilterState;
    orientation?: 'portrait' | 'landscape';
    pageSize?: 'a4' | 'letter' | 'legal';
}

export interface PDFExportOptions extends ExportOptions {
    format: 'pdf';
    title?: string;
    subtitle?: string;
    logo?: string;
    headerText?: string;
    footerText?: string;
    includeTableOfContents?: boolean;
    author?: string;
    subject?: string;
}

export interface ExcelExportOptions extends ExportOptions {
    format: 'excel';
    sheetNames?: string[];
    includeFormulas?: boolean;
    autoFilter?: boolean;
    freezeHeader?: boolean;
}

export interface CSVExportOptions extends ExportOptions {
    format: 'csv';
    delimiter?: string;
    includeHeaders?: boolean;
}

export interface ScheduledReport {
    id: string;
    userId: string;
    projectId?: string;
    name: string;
    description?: string;
    reportType: 'pdf' | 'excel' | 'csv';
    dashboardId: string;
    scheduleFrequency: 'daily' | 'weekly' | 'monthly';
    scheduleDay?: number; // Day of week (0-6) or day of month (1-31)
    scheduleTime: string; // HH:MM format
    recipients: string[];
    filters?: FilterState;
    isActive: boolean;
    lastRunAt?: Date;
    nextRunAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

export interface ReportExecution {
    id: string;
    scheduledReportId: string;
    status: 'success' | 'failed';
    errorMessage?: string;
    fileSize?: number;
    recipientsCount: number;
    executedAt: Date;
}

export interface ChartExportOptions {
    format: 'png' | 'jpeg';
    quality?: number; // 0-1
    width?: number;
    height?: number;
    backgroundColor?: string;
    scale?: number; // For high DPI displays
}

export interface ExportProgress {
    stage: 'preparing' | 'exporting-charts' | 'generating-file' | 'sending-email' | 'complete';
    progress: number; // 0-100
    message?: string;
}
