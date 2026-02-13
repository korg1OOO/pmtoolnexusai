import type { CSSProperties } from 'react';

export interface ConditionalFormat {
    id: string;
    range: {
        startRow: number;
        endRow: number;
        startCol: number;
        endCol: number;
    };
    type: 'value' | 'formula' | 'colorScale' | 'dataBar';
    rule: {
        // Value-based
        operator?: 'greaterThan' | 'lessThan' | 'between' | 'equal' | 'notEqual' | 'contains' | 'startsWith' | 'endsWith';
        value?: any;
        value2?: any; // for 'between'

        // Formula-based
        formula?: string;

        // Color scale
        minColor?: string;
        midColor?: string;
        maxColor?: string;

        // Data bar
        barColor?: string;
        showValue?: boolean;
    };
    style: {
        backgroundColor?: string;
        textColor?: string;
        bold?: boolean;
        italic?: boolean;
        underline?: boolean;
    };
    priority: number; // Lower number = higher priority
}

/**
 * Evaluate if a cell meets a conditional format's condition
 */
export function evaluateCondition(
    value: any,
    rule: ConditionalFormat['rule'],
    row: number,
    col: number,
    allData: any[][]
): boolean {
    const { operator, value: targetValue, value2, formula } = rule;

    // Formula-based evaluation
    if (formula) {
        try {
            // Simple formula evaluation (can be enhanced with a proper formula parser)
            // For now, support basic comparisons
            const formulaStr = formula.replace(/\$?([A-Z]+)\$?(\d+)/g, (match, colStr, rowStr) => {
                const formulaCol = colStr.charCodeAt(0) - 65; // A=0, B=1, etc.
                const formulaRow = parseInt(rowStr) - 1;
                return allData[formulaRow]?.[formulaCol] ?? '';
            });

            // Very basic evaluation - in production, use a proper formula parser
            return eval(formulaStr) === true;
        } catch (e) {
            console.warn('Formula evaluation error:', e);
            return false;
        }
    }

    // Value-based evaluation
    const cellValue = String(value ?? '');
    const target = String(targetValue ?? '');

    switch (operator) {
        case 'greaterThan':
            return Number(value) > Number(targetValue);

        case 'lessThan':
            return Number(value) < Number(targetValue);

        case 'between':
            return Number(value) >= Number(targetValue) && Number(value) <= Number(value2);

        case 'equal':
            return cellValue === target;

        case 'notEqual':
            return cellValue !== target;

        case 'contains':
            return cellValue.toLowerCase().includes(target.toLowerCase());

        case 'startsWith':
            return cellValue.toLowerCase().startsWith(target.toLowerCase());

        case 'endsWith':
            return cellValue.toLowerCase().endsWith(target.toLowerCase());

        default:
            return false;
    }
}

/**
 * Get the conditional formatting style for a cell
 * Returns the style from the highest priority matching rule
 */
export function getConditionalStyle(
    value: any,
    row: number,
    col: number,
    formats: ConditionalFormat[],
    allData: any[][]
): CSSProperties {
    // Filter formats that apply to this cell
    const applicableFormats = formats.filter(format => {
        const { startRow, endRow, startCol, endCol } = format.range;
        return row >= startRow && row <= endRow && col >= startCol && col <= endCol;
    });

    if (applicableFormats.length === 0) {
        return {};
    }

    // Sort by priority (lower number = higher priority)
    const sortedFormats = [...applicableFormats].sort((a, b) => a.priority - b.priority);

    // Find first matching rule
    for (const format of sortedFormats) {
        if (evaluateCondition(value, format.rule, row, col, allData)) {
            const style: CSSProperties = {};

            if (format.style.backgroundColor) {
                style.backgroundColor = format.style.backgroundColor;
            }
            if (format.style.textColor) {
                style.color = format.style.textColor;
            }
            if (format.style.bold) {
                style.fontWeight = 'bold';
            }
            if (format.style.italic) {
                style.fontStyle = 'italic';
            }
            if (format.style.underline) {
                style.textDecoration = 'underline';
            }

            return style;
        }
    }

    return {};
}

/**
 * Get all formats that apply to a specific range
 */
export function getFormatsForRange(
    startRow: number,
    endRow: number,
    startCol: number,
    endCol: number,
    formats: ConditionalFormat[]
): ConditionalFormat[] {
    return formats.filter(format => {
        // Check if ranges overlap
        return !(
            format.range.endRow < startRow ||
            format.range.startRow > endRow ||
            format.range.endCol < startCol ||
            format.range.startCol > endCol
        );
    });
}
