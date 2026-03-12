import React from 'react';
import {
    PieChart as RechartsPie,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import type { ChartOptions } from './types';

interface PieChartRendererProps {
    data: Array<{ name: string; value: number }>;
    options: ChartOptions;
}

export function PieChartRenderer({ data, options }: PieChartRendererProps) {
    const colors = options.colors || [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={options.showLabels}
                    label={options.showLabels ? (entry) => `${entry.name}: ${entry.value}` : false}
                    outerRadius={options.donut ? 100 : 120}
                    innerRadius={options.donut ? 60 : 0}
                    fill="#8884d8"
                    dataKey="value"
                    isAnimationActive={options.animated}
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                </Pie>

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
            </RechartsPie>
        </ResponsiveContainer>
    );
}
