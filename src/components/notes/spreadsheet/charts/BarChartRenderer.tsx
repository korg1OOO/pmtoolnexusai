import React from 'react';
import {
    BarChart as RechartsBar,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { ChartOptions } from './types';

interface BarChartRendererProps {
    data: Array<{ name: string;[key: string]: string | number }>;
    seriesNames: string[];
    options: ChartOptions;
}

export function BarChartRenderer({ data, seriesNames, options }: BarChartRendererProps) {
    const colors = options.colors || [];
    const layout = options.orientation === 'horizontal' ? 'horizontal' : 'vertical';

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsBar
                data={data}
                layout={layout}
            >
                {options.showGrid && <CartesianGrid strokeDasharray="3 3" />}

                <XAxis
                    dataKey={layout === 'vertical' ? 'name' : undefined}
                    type={layout === 'vertical' ? 'category' : 'number'}
                    label={options.xAxisLabel ? { value: options.xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
                />

                <YAxis
                    dataKey={layout === 'horizontal' ? 'name' : undefined}
                    type={layout === 'horizontal' ? 'category' : 'number'}
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
                    <Bar
                        key={series}
                        dataKey={series}
                        fill={colors[idx % colors.length]}
                        stackId={options.stacked ? 'stack' : undefined}
                        isAnimationActive={options.animated}
                    />
                ))}
            </RechartsBar>
        </ResponsiveContainer>
    );
}
