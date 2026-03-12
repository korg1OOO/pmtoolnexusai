import React from 'react';
import {
    LineChart as RechartsLine,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { ChartOptions } from './types';

interface LineChartRendererProps {
    data: Array<{ name: string;[key: string]: string | number }>;
    seriesNames: string[];
    options: ChartOptions;
}

export function LineChartRenderer({ data, seriesNames, options }: LineChartRendererProps) {
    const colors = options.colors || [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data}>
                {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}

                <XAxis
                    dataKey="name"
                    label={options.xAxisLabel ? { value: options.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                />

                <YAxis
                    label={options.yAxisLabel ? { value: options.yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
                />

                <Tooltip />

                {options.showLegend && (
                    <Legend
                        verticalAlign={
                            options.legendPosition === 'top' || options.legendPosition === 'bottom'
                                ? options.legendPosition
                                : 'top'
                        }
                        align={
                            options.legendPosition === 'left' || options.legendPosition === 'right'
                                ? options.legendPosition === 'left' ? 'left' : 'right'
                                : 'center'
                        }
                    />
                )}

                {seriesNames.map((series, idx) => (
                    <Line
                        key={series}
                        type={options.smooth ? 'monotone' : 'linear'}
                        dataKey={series}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        dot={options.showDataPoints}
                        isAnimationActive={options.animated}
                    />
                ))}
            </RechartsLine>
        </ResponsiveContainer>
    );
}
