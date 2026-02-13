export interface PivotTableConfig {
    id: string;
    name: string;
    description?: string;
    sourceRange: {
        startRow: number;
        startCol: number;
        endRow: number;
        endCol: number;
    };
    rows: string[]; // Column names to use as row headers
    columns: string[]; // Column names to use as column headers
    values: ValueField[];
    filters?: FilterConfig[];
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    showGrandTotals: boolean;
    showSubtotals: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ValueField {
    column: string;
    aggregation: 'sum' | 'average' | 'count' | 'min' | 'max' | 'count-numbers';
    format?: 'number' | 'currency' | 'percentage';
    label?: string; // Custom label for this value field
}

export interface FilterConfig {
    column: string;
    type: 'include' | 'exclude';
    values: any[];
}

export interface PivotTableData {
    headers: {
        rows: string[];
        columns: string[][];
    };
    data: Map<string, Map<string, any>>; // row key -> column key -> value
    rowTotals?: Map<string, any>;
    columnTotals?: Map<string, any>;
    grandTotal?: any;
}
