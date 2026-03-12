import type { PivotTableConfig, PivotTableData, ValueField } from './types';

/**
 * Pivot Table Engine - Aggregates source data into pivot table format
 */
export class PivotTableEngine {
    /**
     * Generate pivot table from source data
     */
    static generate(
        sourceData: any[][],
        config: PivotTableConfig
    ): PivotTableData {
        const { sourceRange, rows, columns, values, filters } = config;

        // Extract source data within range
        const data = this.extractSourceData(sourceData, sourceRange);

        // Get headers from first row
        const headers = data[0] || [];
        const dataRows = data.slice(1);

        // Apply filters
        const filteredRows = this.applyFilters(dataRows, headers, filters || []);

        // Build pivot structure
        const pivotData = this.buildPivotData(
            filteredRows,
            headers,
            rows,
            columns,
            values
        );

        return pivotData;
    }

    /**
     * Extract data from source range
     */
    private static extractSourceData(
        sourceData: any[][],
        range: PivotTableConfig['sourceRange']
    ): any[][] {
        const result: any[][] = [];

        for (let row = range.startRow; row <= range.endRow; row++) {
            const rowData: any[] = [];
            for (let col = range.startCol; col <= range.endCol; col++) {
                rowData.push(sourceData[row]?.[col] || '');
            }
            result.push(rowData);
        }

        return result;
    }

    /**
     * Apply filters to data rows
     */
    private static applyFilters(
        dataRows: any[][],
        headers: any[],
        filters: PivotTableConfig['filters']
    ): any[][] {
        if (!filters || filters.length === 0) return dataRows;

        return dataRows.filter((row) => {
            return filters.every((filter) => {
                const colIndex = headers.indexOf(filter.column);
                if (colIndex === -1) return true;

                const cellValue = row[colIndex];
                const isIncluded = filter.values.includes(cellValue);

                return filter.type === 'include' ? isIncluded : !isIncluded;
            });
        });
    }

    /**
     * Build pivot table data structure
     */
    private static buildPivotData(
        dataRows: any[][],
        headers: any[],
        rowFields: string[],
        columnFields: string[],
        valueFields: ValueField[]
    ): PivotTableData {
        // Get column indices
        const rowIndices = rowFields.map((f) => headers.indexOf(f));
        const colIndices = columnFields.map((f) => headers.indexOf(f));
        const valueIndices = valueFields.map((f) => headers.indexOf(f.column));

        // Group data
        const groups = new Map<string, any[]>();

        dataRows.forEach((row) => {
            const rowKey = rowIndices.map((i) => row[i] || '(Blank)').join('|');
            const colKey = colIndices.map((i) => row[i] || '(Blank)').join('|');
            const compositeKey = `${rowKey}::${colKey}`;

            if (!groups.has(compositeKey)) {
                groups.set(compositeKey, []);
            }
            groups.get(compositeKey)!.push(row);
        });

        // Aggregate values
        const pivotMap = new Map<string, Map<string, any>>();
        const rowKeys = new Set<string>();
        const colKeys = new Set<string>();

        groups.forEach((rows, compositeKey) => {
            const [rowKey, colKey] = compositeKey.split('::');
            rowKeys.add(rowKey);
            colKeys.add(colKey);

            if (!pivotMap.has(rowKey)) {
                pivotMap.set(rowKey, new Map());
            }

            const aggregatedValues: any = {};
            valueFields.forEach((valueField, index) => {
                const valueIndex = valueIndices[index];
                const values = rows.map((r) => r[valueIndex]).filter((v) => v !== '' && v != null);

                aggregatedValues[valueField.column] = this.aggregate(
                    values,
                    valueField.aggregation
                );
            });

            pivotMap.get(rowKey)!.set(colKey, aggregatedValues);
        });

        // Calculate totals if needed
        const rowTotals = this.calculateRowTotals(pivotMap, valueFields);
        const columnTotals = this.calculateColumnTotals(pivotMap, Array.from(colKeys), valueFields);
        const grandTotal = this.calculateGrandTotal(Array.from(pivotMap.values()), valueFields);

        return {
            headers: {
                rows: Array.from(rowKeys),
                columns: [Array.from(colKeys)],
            },
            data: pivotMap,
            rowTotals,
            columnTotals,
            grandTotal,
        };
    }

    /**
     * Aggregate values based on function type
     */
    private static aggregate(values: any[], type: ValueField['aggregation']): number {
        const numbers = values.map(Number).filter((n) => !isNaN(n));

        if (numbers.length === 0) return 0;

        switch (type) {
            case 'sum':
                return numbers.reduce((sum, val) => sum + val, 0);
            case 'average':
                return numbers.reduce((sum, val) => sum + val, 0) / numbers.length;
            case 'count':
                return values.length;
            case 'count-numbers':
                return numbers.length;
            case 'min':
                return Math.min(...numbers);
            case 'max':
                return Math.max(...numbers);
            default:
                return 0;
        }
    }

    /**
     * Calculate row totals
     */
    private static calculateRowTotals(
        pivotMap: Map<string, Map<string, any>>,
        valueFields: ValueField[]
    ): Map<string, any> {
        const totals = new Map<string, any>();

        pivotMap.forEach((columns, rowKey) => {
            const rowTotal: any = {};

            valueFields.forEach((field) => {
                const values: number[] = [];
                columns.forEach((cellData) => {
                    if (cellData[field.column] != null) {
                        values.push(Number(cellData[field.column]));
                    }
                });

                rowTotal[field.column] = this.aggregate(values, field.aggregation);
            });

            totals.set(rowKey, rowTotal);
        });

        return totals;
    }

    /**
     * Calculate column totals
     */
    private static calculateColumnTotals(
        pivotMap: Map<string, Map<string, any>>,
        colKeys: string[],
        valueFields: ValueField[]
    ): Map<string, any> {
        const totals = new Map<string, any>();

        colKeys.forEach((colKey) => {
            const colTotal: any = {};

            valueFields.forEach((field) => {
                const values: number[] = [];

                pivotMap.forEach((columns) => {
                    const cellData = columns.get(colKey);
                    if (cellData && cellData[field.column] != null) {
                        values.push(Number(cellData[field.column]));
                    }
                });

                colTotal[field.column] = this.aggregate(values, field.aggregation);
            });

            totals.set(colKey, colTotal);
        });

        return totals;
    }

    /**
     * Calculate grand total
     */
    private static calculateGrandTotal(
        allColumns: Map<string, any>[],
        valueFields: ValueField[]
    ): any {
        const grandTotal: any = {};

        valueFields.forEach((field) => {
            const allValues: number[] = [];

            allColumns.forEach((columns) => {
                columns.forEach((cellData) => {
                    if (cellData[field.column] != null) {
                        allValues.push(Number(cellData[field.column]));
                    }
                });
            });

            grandTotal[field.column] = this.aggregate(allValues, field.aggregation);
        });

        return grandTotal;
    }
}
