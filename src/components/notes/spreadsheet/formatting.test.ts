/**
 * Deep behavioral tests for spreadsheet conditional formatting
 * Tests: evaluateCondition (8 operators), getConditionalStyle, getFormatsForRange
 */
import { describe, it, expect } from 'vitest';
import {
    evaluateCondition,
    getConditionalStyle,
    getFormatsForRange,
    type ConditionalFormat,
} from './formatting';

// Helper to create a format rule
const makeFormat = (overrides: Partial<ConditionalFormat> = {}): ConditionalFormat => ({
    id: 'test-fmt',
    range: { startRow: 0, endRow: 9, startCol: 0, endCol: 9 },
    type: 'value',
    rule: {},
    style: {},
    priority: 1,
    ...overrides,
});

describe('evaluateCondition', () => {
    const data: any[][] = [];

    describe('greaterThan operator', () => {
        it('returns true when value > target', () => {
            expect(evaluateCondition(100, { operator: 'greaterThan', value: 50 }, 0, 0, data)).toBe(true);
        });
        it('returns false when value <= target', () => {
            expect(evaluateCondition(50, { operator: 'greaterThan', value: 50 }, 0, 0, data)).toBe(false);
            expect(evaluateCondition(30, { operator: 'greaterThan', value: 50 }, 0, 0, data)).toBe(false);
        });
    });

    describe('lessThan operator', () => {
        it('returns true when value < target', () => {
            expect(evaluateCondition(30, { operator: 'lessThan', value: 50 }, 0, 0, data)).toBe(true);
        });
        it('returns false when value >= target', () => {
            expect(evaluateCondition(50, { operator: 'lessThan', value: 50 }, 0, 0, data)).toBe(false);
        });
    });

    describe('equal operator', () => {
        it('returns true for exact match', () => {
            expect(evaluateCondition('hello', { operator: 'equal', value: 'hello' }, 0, 0, data)).toBe(true);
        });
        it('returns false for non-match', () => {
            expect(evaluateCondition('world', { operator: 'equal', value: 'hello' }, 0, 0, data)).toBe(false);
        });
        it('compares as strings', () => {
            expect(evaluateCondition(42, { operator: 'equal', value: '42' }, 0, 0, data)).toBe(true);
        });
    });

    describe('notEqual operator', () => {
        it('returns true when different', () => {
            expect(evaluateCondition('hello', { operator: 'notEqual', value: 'world' }, 0, 0, data)).toBe(true);
        });
        it('returns false when equal', () => {
            expect(evaluateCondition('hello', { operator: 'notEqual', value: 'hello' }, 0, 0, data)).toBe(false);
        });
    });

    describe('contains operator', () => {
        it('returns true when value contains target', () => {
            expect(evaluateCondition('Hello World', { operator: 'contains', value: 'World' }, 0, 0, data)).toBe(true);
        });
        it('is case-insensitive', () => {
            expect(evaluateCondition('Hello World', { operator: 'contains', value: 'world' }, 0, 0, data)).toBe(true);
        });
        it('returns false when not contained', () => {
            expect(evaluateCondition('Hello', { operator: 'contains', value: 'xyz' }, 0, 0, data)).toBe(false);
        });
    });

    describe('startsWith operator', () => {
        it('returns true when starts with target', () => {
            expect(evaluateCondition('Hello World', { operator: 'startsWith', value: 'Hello' }, 0, 0, data)).toBe(true);
        });
        it('is case-insensitive', () => {
            expect(evaluateCondition('Hello World', { operator: 'startsWith', value: 'hello' }, 0, 0, data)).toBe(true);
        });
        it('returns false when does not start with', () => {
            expect(evaluateCondition('Hello', { operator: 'startsWith', value: 'World' }, 0, 0, data)).toBe(false);
        });
    });

    describe('endsWith operator', () => {
        it('returns true when ends with target', () => {
            expect(evaluateCondition('Hello World', { operator: 'endsWith', value: 'World' }, 0, 0, data)).toBe(true);
        });
        it('is case-insensitive', () => {
            expect(evaluateCondition('Hello World', { operator: 'endsWith', value: 'world' }, 0, 0, data)).toBe(true);
        });
    });

    describe('between operator', () => {
        it('returns true when in range', () => {
            expect(evaluateCondition(50, { operator: 'between', value: 10, value2: 100 }, 0, 0, data)).toBe(true);
        });
        it('returns true at boundaries', () => {
            expect(evaluateCondition(10, { operator: 'between', value: 10, value2: 100 }, 0, 0, data)).toBe(true);
        });
    });

    describe('unknown operator', () => {
        it('returns false', () => {
            expect(evaluateCondition('value', { operator: undefined }, 0, 0, data)).toBe(false);
        });
    });

    describe('null/undefined values', () => {
        it('handles null value', () => {
            expect(evaluateCondition(null, { operator: 'equal', value: '' }, 0, 0, data)).toBe(true);
        });
    });
});

describe('getConditionalStyle', () => {
    const data: any[][] = [[100]];

    it('returns empty object when no formats apply', () => {
        expect(getConditionalStyle(100, 0, 0, [], data)).toEqual({});
    });

    it('returns empty object when cell outside format range', () => {
        const formats = [makeFormat({
            range: { startRow: 5, endRow: 10, startCol: 0, endCol: 0 },
            rule: { operator: 'greaterThan', value: 0 },
        })];
        expect(getConditionalStyle(100, 0, 0, formats, data)).toEqual({});
    });

    it('applies backgroundColor', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 50 },
            style: { backgroundColor: '#ff0000' },
        })];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.backgroundColor).toBe('#ff0000');
    });

    it('applies textColor as color', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 50 },
            style: { textColor: '#00ff00' },
        })];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.color).toBe('#00ff00');
    });

    it('applies bold', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 50 },
            style: { bold: true },
        })];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.fontWeight).toBe('bold');
    });

    it('applies italic', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 50 },
            style: { italic: true },
        })];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.fontStyle).toBe('italic');
    });

    it('applies underline', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 50 },
            style: { underline: true },
        })];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.textDecoration).toBe('underline');
    });

    it('uses highest priority format (lowest number)', () => {
        const formats = [
            makeFormat({
                id: 'low-priority',
                priority: 10,
                rule: { operator: 'greaterThan', value: 50 },
                style: { backgroundColor: '#0000ff' },
            }),
            makeFormat({
                id: 'high-priority',
                priority: 1,
                rule: { operator: 'greaterThan', value: 50 },
                style: { backgroundColor: '#ff0000' },
            }),
        ];
        const style = getConditionalStyle(100, 0, 0, formats, data);
        expect(style.backgroundColor).toBe('#ff0000');
    });

    it('returns empty when condition not met', () => {
        const formats = [makeFormat({
            rule: { operator: 'greaterThan', value: 200 },
            style: { backgroundColor: '#ff0000' },
        })];
        expect(getConditionalStyle(100, 0, 0, formats, data)).toEqual({});
    });
});

describe('getFormatsForRange', () => {
    const formats = [
        makeFormat({ id: 'a', range: { startRow: 0, endRow: 5, startCol: 0, endCol: 3 } }),
        makeFormat({ id: 'b', range: { startRow: 10, endRow: 20, startCol: 0, endCol: 3 } }),
        makeFormat({ id: 'c', range: { startRow: 3, endRow: 7, startCol: 2, endCol: 5 } }),
    ];

    it('returns overlapping formats', () => {
        const result = getFormatsForRange(0, 5, 0, 3, formats);
        expect(result.map(f => f.id)).toContain('a');
        expect(result.map(f => f.id)).toContain('c');
    });

    it('excludes non-overlapping formats', () => {
        const result = getFormatsForRange(0, 2, 0, 1, formats);
        expect(result.map(f => f.id)).toContain('a');
        expect(result.map(f => f.id)).not.toContain('b');
        expect(result.map(f => f.id)).not.toContain('c');
    });

    it('returns empty for non-matching range', () => {
        const result = getFormatsForRange(50, 60, 50, 60, formats);
        expect(result).toHaveLength(0);
    });
});
