/**
 * Deep behavioral tests for spreadsheet validation
 * Tests validateCell and getRuleForCell with all validation types
 */
import { describe, it, expect } from 'vitest';
import { validateCell, getRuleForCell, type ValidationRule } from './validation';

// Helper: create a basic rule for cells A1:A10 (row 0-9, col 0)
const makeRule = (overrides: Partial<ValidationRule>): ValidationRule => ({
    id: 'test-rule',
    range: { startRow: 0, endRow: 9, startCol: 0, endCol: 0 },
    type: 'number',
    criteria: {},
    allowBlank: false,
    ...overrides,
});

describe('getRuleForCell', () => {
    const rules = [
        makeRule({ id: 'col-a', range: { startRow: 0, endRow: 9, startCol: 0, endCol: 0 } }),
        makeRule({ id: 'col-b', range: { startRow: 0, endRow: 9, startCol: 1, endCol: 1 } }),
    ];

    it('returns rule matching cell position', () => {
        expect(getRuleForCell(0, 0, rules)?.id).toBe('col-a');
        expect(getRuleForCell(0, 1, rules)?.id).toBe('col-b');
    });

    it('returns null for cell outside rules', () => {
        expect(getRuleForCell(0, 5, rules)).toBeNull();
    });

    it('returns null for empty rules', () => {
        expect(getRuleForCell(0, 0, [])).toBeNull();
    });
});

describe('validateCell - number type', () => {
    it('returns null when no rule matches', () => {
        expect(validateCell(42, 0, 5, [])).toBeNull();
    });

    it('rejects non-numeric value', () => {
        const rules = [makeRule({ type: 'number' })];
        const result = validateCell('abc', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('valid number');
    });

    it('accepts valid number', () => {
        const rules = [makeRule({ type: 'number' })];
        expect(validateCell(42, 0, 0, rules)).toBeNull();
    });

    it('rejects number below min', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 10 } })];
        const result = validateCell(5, 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('>= 10');
    });

    it('accepts number at min', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 10 } })];
        expect(validateCell(10, 0, 0, rules)).toBeNull();
    });

    it('rejects number above max', () => {
        const rules = [makeRule({ type: 'number', criteria: { max: 100 } })];
        const result = validateCell(150, 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('<= 100');
    });

    it('accepts number within range', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 0, max: 100 } })];
        expect(validateCell(50, 0, 0, rules)).toBeNull();
    });

    it('accepts numeric string', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 0 } })];
        expect(validateCell('42', 0, 0, rules)).toBeNull();
    });
});

describe('validateCell - list type', () => {
    const rules = [makeRule({ type: 'list', criteria: { list: ['apple', 'banana', 'cherry'] } })];

    it('accepts value in list', () => {
        expect(validateCell('apple', 0, 0, rules)).toBeNull();
        expect(validateCell('banana', 0, 0, rules)).toBeNull();
    });

    it('rejects value not in list', () => {
        const result = validateCell('grape', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('list');
    });
});

describe('validateCell - date type', () => {
    const rules = [makeRule({
        type: 'date',
        criteria: { startDate: '2024-01-01', endDate: '2024-12-31' },
    })];

    it('accepts date within range', () => {
        expect(validateCell('2024-06-15', 0, 0, rules)).toBeNull();
    });

    it('rejects date before start', () => {
        const result = validateCell('2023-06-15', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('after');
    });

    it('rejects date after end', () => {
        const result = validateCell('2025-06-15', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('before');
    });

    it('rejects invalid date string', () => {
        const result = validateCell('not-a-date', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('valid date');
    });
});

describe('validateCell - text type', () => {
    it('rejects text below minLength', () => {
        const rules = [makeRule({ type: 'text', criteria: { minLength: 5 } })];
        const result = validateCell('abc', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('at least 5');
    });

    it('accepts text at minLength', () => {
        const rules = [makeRule({ type: 'text', criteria: { minLength: 3 } })];
        expect(validateCell('abc', 0, 0, rules)).toBeNull();
    });

    it('rejects text above maxLength', () => {
        const rules = [makeRule({ type: 'text', criteria: { maxLength: 3 } })];
        const result = validateCell('abcdef', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('at most 3');
    });

    it('rejects text not matching pattern', () => {
        const rules = [makeRule({ type: 'text', criteria: { pattern: '^[A-Z]+$' } })];
        const result = validateCell('abc', 0, 0, rules);
        expect(result).not.toBeNull();
        expect(result?.message).toContain('pattern');
    });

    it('accepts text matching pattern', () => {
        const rules = [makeRule({ type: 'text', criteria: { pattern: '^[A-Z]+$' } })];
        expect(validateCell('ABC', 0, 0, rules)).toBeNull();
    });
});

describe('validateCell - allowBlank', () => {
    it('allows null when allowBlank is true', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 1 }, allowBlank: true })];
        expect(validateCell(null, 0, 0, rules)).toBeNull();
    });

    it('allows empty string when allowBlank is true', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 1 }, allowBlank: true })];
        expect(validateCell('', 0, 0, rules)).toBeNull();
    });

    it('still validates non-blank values when allowBlank is true', () => {
        const rules = [makeRule({ type: 'number', criteria: { min: 10 }, allowBlank: true })];
        const result = validateCell(5, 0, 0, rules);
        expect(result).not.toBeNull();
    });
});

describe('validateCell - formula type', () => {
    it('returns null (deferred implementation)', () => {
        const rules = [makeRule({ type: 'formula', criteria: { formula: '=A1>0' } })];
        expect(validateCell(42, 0, 0, rules)).toBeNull();
    });
});

describe('validateCell - custom error messages', () => {
    it('uses custom errorMessage when provided', () => {
        const rules = [makeRule({
            type: 'number',
            criteria: { min: 10 },
            errorMessage: 'Value too low!',
        })];
        const result = validateCell(5, 0, 0, rules);
        expect(result?.message).toBe('Value too low!');
    });
});

describe('validateCell - error structure', () => {
    it('includes row, col, message, and rule', () => {
        const rules = [makeRule({ type: 'number' })];
        const result = validateCell('abc', 3, 0, rules);
        expect(result).toEqual(expect.objectContaining({
            row: 3,
            col: 0,
            message: expect.any(String),
            rule: expect.any(Object),
        }));
    });
});
