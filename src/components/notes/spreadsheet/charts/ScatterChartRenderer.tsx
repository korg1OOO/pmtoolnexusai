import React from 'react';
import {
    ScatterChart as RechartsScatter,
    Scatter,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { ChartOptions } from './types';

interface ScatterChartRendererProps {
    data: Array<{ x: number; y: number; name?: string }>;
    options: ChartOptions;
}

export function ScatterChartRenderer({ data, options }: ScatterChartRendererProps) {
    const colors = options.colors || [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsScatter>
                {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}

                <XAxis
                    type="number"
                    dataKey="x"
                    name={options.xAxisLabel || 'X'}
                    label={options.xAxisLabel ? { value: options.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                />

                <YAxis
                    type="number"
                    dataKey="y"
                    name={options.yAxisLabel || 'Y'}
                    label={options.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                />

                <Tooltip cursor={{ strokeDasharray: '3 3' }} />

                {options.showLegend && <Legend />}

                <Scatter
                    name={options.title || 'Data'}
                    data={data}
                    fill={colors[0]}
                    isAnimationActive={options.animated}
                />
            </RechartsScatter>
        </ResponsiveContainer>
    );
}
