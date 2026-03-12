import React from 'react';
import { LineChartRenderer } from './LineChartRenderer';
import { BarChartRenderer } from './BarChartRenderer';
import { PieChartRenderer } from './PieChartRenderer';
import { AreaChartRenderer } from './AreaChartRenderer';
import { ScatterChartRenderer } from './ScatterChartRenderer';
import { processChartData } from './utils';
import type { ChartConfig } from './types';

interface ChartRendererProps {
    config: ChartConfig;
    data: any[][];
}

export function ChartRenderer({ config, data }: ChartRendererProps) {
    const processed = processChartData(data, config.dataRange, config.type);

    // Error handling
    if (!processed) {
        return (
            <div className="flex items-center justify-center h-full bg-muted/20 rounded border border-border">
                <p className="text-sm text-muted-foreground">Unable to process chart data</p>
            </div>
        );
    }

    // Render appropriate chart type
    switch (config.type) {
        case 'line':
            if (!processed.chartData || !processed.seriesNames) {
                return <div className="text-sm text-destructive">Invalid data for line chart</div>;
            }
            return (
                <LineChartRenderer
                    data={processed.chartData}
                    seriesNames={processed.seriesNames}
                    options={config.options}
                />
            );

        case 'bar':
            if (!processed.chartData || !processed.seriesNames) {
                return <div className="text-sm text-destructive">Invalid data for bar chart</div>;
            }
            return (
                <BarChartRenderer
                    data={processed.chartData}
                    seriesNames={processed.seriesNames}
                    options={config.options}
                />
            );

        case 'pie':
            if (!processed.pieData) {
                return <div className="text-sm text-destructive">Invalid data for pie chart</div>;
            }
            return <PieChartRenderer data={processed.pieData} options={config.options} />;

        case 'area':
            if (!processed.chartData || !processed.seriesNames) {
                return <div className="text-sm text-destructive">Invalid data for area chart</div>;
            }
            return (
                <AreaChartRenderer
                    data={processed.chartData}
                    seriesNames={processed.seriesNames}
                    options={config.options}
                />
            );

        case 'scatter':
            if (!processed.scatterData) {
                return <div className="text-sm text-destructive">Invalid data for scatter plot</div>;
            }
            return <ScatterChartRenderer data={processed.scatterData} options={config.options} />;

        default:
            return <div className="text-sm text-destructive">Unknown chart type: {config.type}</div>;
    }
}
