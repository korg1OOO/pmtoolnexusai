import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { PivotTableConfig, PivotTableData } from './types';

interface PivotTableRendererProps {
    config: PivotTableConfig;
    data: PivotTableData;
}

export function PivotTableRenderer({ config, data }: PivotTableRendererProps) {
    const { headers, data: pivotMap, rowTotals, columnTotals, grandTotal } = data;

    const formatValue = (value: number, format?: 'number' | 'currency' | 'percentage'): string => {
        if (value == null || isNaN(value)) return '-';

        switch (format) {
            case 'currency':
                return `$${value.toFixed(2)}`;
            case 'percentage':
                return `${(value * 100).toFixed(1)}%`;
            case 'number':
            default:
                return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
        }
    };

    return (
        <div className="w-full h-full overflow-auto bg-background">
            <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{config.name}</h3>
                {config.description && (
                    <p className="text-sm text-muted-foreground mb-4">{config.description}</p>
                )}

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {/* Row header columns */}
                                {config.rows.map((rowField) => (
                                    <TableHead key={rowField} className="font-semibold bg-muted">
                                        {rowField}
                                    </TableHead>
                                ))}

                                {/* Column headers */}
                                {headers.columns[0]?.map((colValue) => (
                                    <TableHead key={colValue} className="text-right bg-muted">
                                        {colValue}
                                    </TableHead>
                                ))}

                                {/* Row total column */}
                                {config.showGrandTotals && rowTotals && (
                                    <TableHead className="text-right font-semibold bg-muted/80">
                                        Total
                                    </TableHead>
                                )}
                            </TableRow>

                            {/* Value field labels (if multiple values) */}
                            {config.values.length > 1 && (
                                <TableRow>
                                    {config.rows.map((_, i) => (
                                        <TableHead key={i} />
                                    ))}
                                    {headers.columns[0]?.map((colValue) => (
                                        <TableHead key={`${colValue}-values`} className="text-right text-xs">
                                            {config.values.map((v) => v.label || v.column).join(', ')}
                                        </TableHead>
                                    ))}
                                    {config.showGrandTotals && rowTotals && <TableHead />}
                                </TableRow>
                            )}
                        </TableHeader>

                        <TableBody>
                            {/* Data rows */}
                            {headers.rows.map((rowKey) => {
                                const rowData = pivotMap.get(rowKey);
                                const rowValues = rowKey.split('|');

                                return (
                                    <TableRow key={rowKey}>
                                        {/* Row labels */}
                                        {rowValues.map((value, i) => (
                                            <TableCell key={`${rowKey}-${i}`} className="font-medium">
                                                {value}
                                            </TableCell>
                                        ))}

                                        {/* Cell values */}
                                        {headers.columns[0]?.map((colKey) => {
                                            const cellData = rowData?.get(colKey);

                                            return (
                                                <TableCell key={`${rowKey}-${colKey}`} className="text-right">
                                                    {config.values.map((valueField, vIdx) => {
                                                        const value = cellData?.[valueField.column];
                                                        return (
                                                            <div key={vIdx}>
                                                                {formatValue(value, valueField.format)}
                                                            </div>
                                                        );
                                                    })}
                                                </TableCell>
                                            );
                                        })}

                                        {/* Row total */}
                                        {config.showGrandTotals && rowTotals && (
                                            <TableCell className="text-right font-semibold bg-muted/30">
                                                {config.values.map((valueField, vIdx) => {
                                                    const total = rowTotals.get(rowKey)?.[valueField.column];
                                                    return (
                                                        <div key={vIdx}>
                                                            {formatValue(total, valueField.format)}
                                                        </div>
                                                    );
                                                })}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}

                            {/* Column totals row */}
                            {config.showGrandTotals && columnTotals && (
                                <TableRow className="bg-muted/50">
                                    <TableCell colSpan={config.rows.length} className="font-semibold">
                                        Total
                                    </TableCell>

                                    {headers.columns[0]?.map((colKey) => {
                                        const colTotal = columnTotals.get(colKey);

                                        return (
                                            <TableCell key={`total-${colKey}`} className="text-right font-semibold">
                                                {config.values.map((valueField, vIdx) => {
                                                    const total = colTotal?.[valueField.column];
                                                    return (
                                                        <div key={vIdx}>
                                                            {formatValue(total, valueField.format)}
                                                        </div>
                                                    );
                                                })}
                                            </TableCell>
                                        );
                                    })}

                                    {/* Grand total cell */}
                                    {config.showGrandTotals && (
                                        <TableCell className="text-right font-bold bg-muted/50">
                                            {config.values.map((valueField, vIdx) => {
                                                const total = grandTotal?.[valueField.column];
                                                return (
                                                    <div key={vIdx}>
                                                        {formatValue(total, valueField.format)}
                                                    </div>
                                                );
                                            })}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Metadata */}
                <div className="mt-2 text-xs text-muted-foreground">
                    {headers.rows.length} rows × {headers.columns[0]?.length || 0} columns
                    {' | '}
                    {config.values.map((v) => `${v.label || v.column} (${v.aggregation})`).join(', ')}
                </div>
            </div>
        </div>
    );
}
