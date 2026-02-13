/**
 * Chart type definitions for spreadsheet charts
 */

export type ChartType = 'line' | 'bar' | 'pie' | 'area' | 'scatter';

export interface ChartDataRange {
    startRow: number;
    endRow: number;
    startCol: number;
    endCol: number;
}

export interface ChartOptions {
    title?: string;
    description?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    showLegend: boolean;
    legendPosition: 'top' | 'bottom' | 'left' | 'right';
    colors?: string[];
    showGrid: boolean;
    animated: boolean;
    // Chart-specific options
    orientation?: 'vertical' | 'horizontal'; // For bar charts
    stacked?: boolean; // For bar/area charts
    showDataPoints?: boolean; // For line charts
    smooth?: boolean; // For line/area charts
    donut?: boolean; // For pie charts
    showLabels?: boolean; // For pie charts
}

export interface ChartConfig {
    id: string;
    type: ChartType;
    title: string;
    description?: string;
    dataRange: ChartDataRange;
    options: ChartOptions;
    position: { x: number; y: number };
    size: { width: number; height: number };
    createdAt: string;
    updatedAt: string;
}

export interface ChartData {
    labels: string[];
    datasets: ChartDataset[];
}

export interface ChartDataset {
    label: string;
    data: number[];
    color?: string;
}

export interface ProcessedChartData {
    // For Line, Bar, Area charts
    chartData?: Array<{ name: string;[key: string]: string | number }>;
    // For Pie chart
    pieData?: Array<{ name: string; value: number }>;
    // For Scatter chart
    scatterData?: Array<{ x: number; y: number; name?: string }>;
    // Series names for legend
    seriesNames?: string[];
}

export const DEFAULT_CHART_COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#22c55e', // green
    '#f59e0b', // amber
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
];

export const DEFAULT_CHART_OPTIONS: ChartOptions = {
    showLegend: true,
    legendPosition: 'top',
    showGrid: true,
    animated: true,
    colors: DEFAULT_CHART_COLORS,
};
