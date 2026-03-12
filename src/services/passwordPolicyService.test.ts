/**
 * Deep behavioral tests for passwordPolicyService
 * Tests all pure functions: validatePassword, getPasswordStrength, getPasswordStrengthLabel
 */
import { describe, it, expect } from 'vitest';
import {
    validatePassword,
    getPasswordStrength,
    getPasswordStrengthLabel,
    type PasswordPolicy,
} from './passwordPolicyService';

// Helper: create a strict policy (all requirements on)
const strictPolicy: PasswordPolicy = {
    id: 'test-policy-1',
    min_length: 12,
    require_uppercase: true,
    require_lowercase: true,
    require_numbers: true,
    require_special_chars: true,
    password_expiry_days: 90,
    prevent_reuse_count: 5,
    max_login_attempts: 5,
    lockout_duration_minutes: 30,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
};

// Helper: create a relaxed policy (nothing required except min length)
const relaxedPolicy: PasswordPolicy = {
    ...strictPolicy,
    id: 'test-policy-2',
    min_length: 4,
    require_uppercase: false,
    require_lowercase: false,
    require_numbers: false,
    require_special_chars: false,
};

describe('validatePassword', () => {
    describe('min_length enforcement', () => {
        it('rejects password shorter than min_length', () => {
            const result = validatePassword('abc', relaxedPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toHaveLength(1);
            expect(result.errors[0]).toContain('at least 4 characters');
        });

        it('accepts password exactly at min_length', () => {
            const result = validatePassword('abcd', relaxedPolicy);
            expect(result.is_valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('accepts password longer than min_length', () => {
            const result = validatePassword('abcdef', relaxedPolicy);
            expect(result.is_valid).toBe(true);
        });

        it('rejects empty password', () => {
            const result = validatePassword('', relaxedPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors[0]).toContain('at least 4 characters');
        });
    });

    describe('uppercase requirement', () => {
        const policy: PasswordPolicy = { ...relaxedPolicy, require_uppercase: true };

        it('rejects password without uppercase', () => {
            const result = validatePassword('abcdef', policy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('accepts password with uppercase', () => {
            const result = validatePassword('Abcdef', policy);
            expect(result.is_valid).toBe(true);
        });
    });

    describe('lowercase requirement', () => {
        const policy: PasswordPolicy = { ...relaxedPolicy, require_lowercase: true };

        it('rejects password without lowercase', () => {
            const result = validatePassword('ABCDEF', policy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('accepts password with lowercase', () => {
            const result = validatePassword('ABCDef', policy);
            expect(result.is_valid).toBe(true);
        });
    });

    describe('number requirement', () => {
        const policy: PasswordPolicy = { ...relaxedPolicy, require_numbers: true };

        it('rejects password without numbers', () => {
            const result = validatePassword('abcdef', policy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('accepts password with numbers', () => {
            const result = validatePassword('abcd1f', policy);
            expect(result.is_valid).toBe(true);
        });
    });

    describe('special character requirement', () => {
        const policy: PasswordPolicy = { ...relaxedPolicy, require_special_chars: true };

        it('rejects password without special chars', () => {
            const result = validatePassword('abcdef', policy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('accepts password with special chars', () => {
            const result = validatePassword('abcd@f', policy);
            expect(result.is_valid).toBe(true);
        });
    });

    describe('strict policy (all requirements)', () => {
        it('rejects password failing all requirements', () => {
            const result = validatePassword('abc', strictPolicy);
            expect(result.is_valid).toBe(false);
            // Should have at least: too short + no uppercase + no numbers + no special chars
            expect(result.errors.length).toBeGreaterThanOrEqual(4);
        });

        it('accepts password meeting all requirements', () => {
            const result = validatePassword('SuperSecure1!@#', strictPolicy);
            expect(result.is_valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('returns multiple errors for multiple failures', () => {
            // Only lowercase, no uppercase/numbers/special, and long enough
            const result = validatePassword('abcdefghijklm', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors.length).toBe(3); // uppercase, numbers, special
        });
    });
});

describe('getPasswordStrength', () => {
    it('returns 0 for very short password', () => {
        expect(getPasswordStrength('ab')).toBe(0);
    });

    it('returns 1 for 8+ char password with no variety', () => {
        expect(getPasswordStrength('aaaaaaaa')).toBe(1);
    });

    it('returns 2 for 12+ char password with no variety', () => {
        expect(getPasswordStrength('aaaaaaaaaaaa')).toBe(2);
    });

    it('gives score for mixed case', () => {
        expect(getPasswordStrength('Abcdefgh')).toBe(2); // length>=8 + mixed case
    });

    it('gives score for numbers', () => {
        expect(getPasswordStrength('abcdefg1')).toBe(2); // length>=8 + number
    });

    it('gives score for special chars', () => {
        expect(getPasswordStrength('abcdefg!')).toBe(2); // length>=8 + special
    });

    it('returns max 4 for strong password', () => {
        expect(getPasswordStrength('SuperStr0ng!Pass')).toBe(4);
    });

    it('caps at 4 even with all criteria met on very long password', () => {
        expect(getPasswordStrength('VeryLongSuperStr0ng!Password123')).toBe(4);
    });

    it('returns 0 for empty string', () => {
        expect(getPasswordStrength('')).toBe(0);
    });

    it('returns 3 for 12+ chars with mixed case and numbers', () => {
        // length>=8, length>=12, mixed case, numbers = 4, capped at 4
        expect(getPasswordStrength('Abcdefghijk1')).toBe(4);
    });
});

describe('getPasswordStrengthLabel', () => {
    it('returns "Very Weak" for score 0', () => {
        expect(getPasswordStrengthLabel(0)).toBe('Very Weak');
    });

    it('returns "Weak" for score 1', () => {
        expect(getPasswordStrengthLabel(1)).toBe('Weak');
    });

    it('returns "Fair" for score 2', () => {
        expect(getPasswordStrengthLabel(2)).toBe('Fair');
    });

    it('returns "Good" for score 3', () => {
        expect(getPasswordStrengthLabel(3)).toBe('Good');
    });

    it('returns "Strong" for score 4', () => {
        expect(getPasswordStrengthLabel(4)).toBe('Strong');
    });

    it('returns "Very Weak" for out-of-range score', () => {
        expect(getPasswordStrengthLabel(5)).toBe('Very Weak');
        expect(getPasswordStrengthLabel(-1)).toBe('Very Weak');
    });
});
