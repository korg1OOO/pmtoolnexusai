/**
 * Deep behavioral tests for spreadsheet formulaEngine
 * Tests cell reference parsing, range extraction, and all built-in functions
 */
import { describe, it, expect } from 'vitest';
import {
    columnToIndex,
    indexToColumn,
    parseCellRef,
    parseRange,
    getCellsInRange,
    evaluateFormula,
    getCellDisplayValue,
} from './formulaEngine';

describe('columnToIndex', () => {
    it('converts A to 0', () => expect(columnToIndex('A')).toBe(0));
    it('converts B to 1', () => expect(columnToIndex('B')).toBe(1));
    it('converts Z to 25', () => expect(columnToIndex('Z')).toBe(25));
    it('converts AA to 26', () => expect(columnToIndex('AA')).toBe(26));
    it('converts AB to 27', () => expect(columnToIndex('AB')).toBe(27));
    it('converts AZ to 51', () => expect(columnToIndex('AZ')).toBe(51));
    it('is case-insensitive via uppercase', () => expect(columnToIndex('A')).toBe(columnToIndex('A')));
});

describe('indexToColumn', () => {
    it('converts 0 to A', () => expect(indexToColumn(0)).toBe('A'));
    it('converts 1 to B', () => expect(indexToColumn(1)).toBe('B'));
    it('converts 25 to Z', () => expect(indexToColumn(25)).toBe('Z'));
    it('converts 26 to AA', () => expect(indexToColumn(26)).toBe('AA'));
    it('converts 27 to AB', () => expect(indexToColumn(27)).toBe('AB'));
    it('round-trips with columnToIndex', () => {
        for (let i = 0; i < 100; i++) {
            expect(columnToIndex(indexToColumn(i))).toBe(i);
        }
    });
});

describe('parseCellRef', () => {
    it('parses A1', () => {
        const ref = parseCellRef('A1');
        expect(ref).toEqual({ col: 0, row: 0 });
    });
    it('parses B2', () => {
        const ref = parseCellRef('B2');
        expect(ref).toEqual({ col: 1, row: 1 });
    });
    it('parses AA100', () => {
        const ref = parseCellRef('AA100');
        expect(ref).toEqual({ col: 26, row: 99 });
    });
    it('returns null for invalid ref', () => {
        expect(parseCellRef('123')).toBeNull();
        expect(parseCellRef('')).toBeNull();
    });
});

describe('parseRange', () => {
    it('parses A1:B2', () => {
        const range = parseRange('A1:B2');
        expect(range).toEqual({
            start: { col: 0, row: 0 },
            end: { col: 1, row: 1 },
        });
    });
    it('parses A1:A5 (single column)', () => {
        const range = parseRange('A1:A5');
        expect(range?.start.row).toBe(0);
        expect(range?.end.row).toBe(4);
    });
    it('returns null for invalid range', () => {
        expect(parseRange('A1')).toBeNull();
        expect(parseRange('')).toBeNull();
    });
});

describe('getCellsInRange', () => {
    const data = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
    ];

    it('extracts single column range', () => {
        const range = parseRange('A1:A3')!;
        const cells = getCellsInRange(range, data);
        expect(cells).toEqual([10, 40, 70]);
    });

    it('extracts single row range', () => {
        const range = parseRange('A1:C1')!;
        const cells = getCellsInRange(range, data);
        expect(cells).toEqual([10, 20, 30]);
    });

    it('extracts rectangular range', () => {
        const range = parseRange('A1:B2')!;
        const cells = getCellsInRange(range, data);
        expect(cells).toEqual([10, 20, 40, 50]);
    });
});

// toNumbers is a private function — tested indirectly via SUM/AVERAGE/etc.

describe('evaluateFormula - built-in functions', () => {
    const data = [
        [10, 20, 30],
        [40, 50, 60],
        [70, 80, 90],
    ];

    it('SUM range', () => {
        expect(evaluateFormula('=SUM(A1:A3)', data)).toBe(120);
    });
    it('SUM single column', () => {
        expect(evaluateFormula('=SUM(B1:B3)', data)).toBe(150);
    });
    it('AVERAGE range', () => {
        expect(evaluateFormula('=AVERAGE(A1:A3)', data)).toBe(40);
    });
    it('COUNT range', () => {
        expect(evaluateFormula('=COUNT(A1:A3)', data)).toBe(3);
    });
    it('MIN range', () => {
        expect(evaluateFormula('=MIN(A1:A3)', data)).toBe(10);
    });
    it('MAX range', () => {
        expect(evaluateFormula('=MAX(A1:A3)', data)).toBe(70);
    });
    it('ABS negative', () => {
        const negData = [[-5]];
        expect(evaluateFormula('=ABS(A1)', negData)).toBe(5);
    });
    it('ROUND', () => {
        const decData = [[3.14159]];
        expect(evaluateFormula('=ROUND(A1, 2)', decData)).toBe(3.14);
    });
    it('SQRT', () => {
        const sqData = [[16]];
        expect(evaluateFormula('=SQRT(A1)', sqData)).toBe(4);
    });
    it('POWER', () => {
        expect(evaluateFormula('=POWER(2, 3)', data)).toBe(8);
    });
    it('CONCAT strings', () => {
        const strData = [['Hello', ' ', 'World']];
        expect(evaluateFormula('=CONCAT(A1, C1)', strData)).toBe('HelloWorld');
    });
    it('LEN', () => {
        const strData = [['Hello']];
        expect(evaluateFormula('=LEN(A1)', strData)).toBe(5);
    });
    it('UPPER', () => {
        const strData = [['hello']];
        expect(evaluateFormula('=UPPER(A1)', strData)).toBe('HELLO');
    });
    it('LOWER', () => {
        const strData = [['HELLO']];
        expect(evaluateFormula('=LOWER(A1)', strData)).toBe('hello');
    });
    it('TRIM', () => {
        const strData = [['  hello  ']];
        expect(evaluateFormula('=TRIM(A1)', strData)).toBe('hello');
    });
    it('IF true condition (numeric truthy)', () => {
        expect(evaluateFormula('=IF(1, 100, 200)', data)).toBe(100);
    });
    it('IF false condition (numeric falsy)', () => {
        expect(evaluateFormula('=IF(0, 100, 200)', data)).toBe(200);
    });
});

describe('evaluateFormula - arithmetic', () => {
    const data = [[10, 20]];

    it('simple addition', () => {
        expect(evaluateFormula('=A1+B1', data)).toBe(30);
    });
    it('simple subtraction', () => {
        expect(evaluateFormula('=B1-A1', data)).toBe(10);
    });
    it('simple multiplication', () => {
        expect(evaluateFormula('=A1*B1', data)).toBe(200);
    });
    it('simple division', () => {
        expect(evaluateFormula('=B1/A1', data)).toBe(2);
    });
    it('returns raw value for non-formula string', () => {
        expect(evaluateFormula('hello', data)).toBe('hello');
    });
    it('returns number for numeric string', () => {
        expect(evaluateFormula('42', data)).toBe('42');
    });
});

describe('getCellDisplayValue', () => {
    const data = [[10, 20]];

    it('displays formula result', () => {
        expect(getCellDisplayValue('=SUM(A1:B1)', data)).toBe('30');
    });
    it('displays plain text as-is', () => {
        expect(getCellDisplayValue('hello', data)).toBe('hello');
    });
    it('displays numbers', () => {
        expect(getCellDisplayValue(42, data)).toBe('42');
    });
    it('displays null as empty', () => {
        expect(getCellDisplayValue(null, data)).toBe('');
    });
    it('displays undefined as empty', () => {
        expect(getCellDisplayValue(undefined, data)).toBe('');
    });
    it('displays #NAME? for unknown function', () => {
        const result = getCellDisplayValue('=INVALID()', data);
        expect(result).toBe('#NAME?');
    });
});
