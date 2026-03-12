import React from 'react';
import {
    AreaChart as RechartsArea,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { ChartOptions } from './types';

interface AreaChartRendererProps {
    data: Array<{ name: string;[key: string]: string | number }>;
    seriesNames: string[];
    options: ChartOptions;
}

export function AreaChartRenderer({ data, seriesNames, options }: AreaChartRendererProps) {
    const colors = options.colors || [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsArea data={data}>
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
                    <Area
                        key={series}
                        type={options.smooth ? 'monotone' : 'linear'}
                        dataKey={series}
                        stroke={colors[idx % colors.length]}
                        fill={colors[idx % colors.length]}
                        fillOpacity={0.6}
                        stackId={options.stacked ? 'stack' : undefined}
                        isAnimationActive={options.animated}
                    />
                ))}
            </RechartsArea>
        </ResponsiveContainer>
    );
}
