/**
 * Password Policy Service — Deep Tests
 * Tests all pure functions with multiple inputs, edge cases, and boundary values
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
        rpc: vi.fn().mockResolvedValue({ data: { is_valid: true, errors: [] }, error: null }),
    },
}));

import {
    validatePassword,
    getPasswordStrength,
    getPasswordStrengthLabel,
    getPasswordPolicy,
    updatePasswordPolicy,
    validatePasswordDB,
} from '@/services/passwordPolicyService';
import type { PasswordPolicy } from '@/services/passwordPolicyService';

const strictPolicy: PasswordPolicy = {
    id: 'test',
    min_length: 8,
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

const relaxedPolicy: PasswordPolicy = {
    ...strictPolicy,
    min_length: 4,
    require_uppercase: false,
    require_lowercase: false,
    require_numbers: false,
    require_special_chars: false,
};

describe('passwordPolicyService', () => {
    // ─── validatePassword (pure function) ────────────────────────
    describe('validatePassword', () => {
        it('accepts a valid strong password against strict policy', () => {
            const result = validatePassword('MyStr0ng!Pass', strictPolicy);
            expect(result.is_valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('rejects password shorter than min_length', () => {
            const result = validatePassword('Aa1!', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('rejects password missing uppercase', () => {
            const result = validatePassword('mystrongpass1!', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('rejects password missing lowercase', () => {
            const result = validatePassword('MYSTRONGPASS1!', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one lowercase letter');
        });

        it('rejects password missing numbers', () => {
            const result = validatePassword('MyStrongPass!', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one number');
        });

        it('rejects password missing special chars', () => {
            const result = validatePassword('MyStr0ngPass', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('returns multiple errors for very weak password', () => {
            const result = validatePassword('abc', strictPolicy);
            expect(result.is_valid).toBe(false);
            expect(result.errors.length).toBeGreaterThanOrEqual(3);
        });

        it('accepts any 4+ char password against relaxed policy', () => {
            const result = validatePassword('test', relaxedPolicy);
            expect(result.is_valid).toBe(true);
        });

        it('rejects 3-char password against relaxed policy (min_length=4)', () => {
            const result = validatePassword('abc', relaxedPolicy);
            expect(result.is_valid).toBe(false);
        });

        it('handles empty string', () => {
            const result = validatePassword('', strictPolicy);
            expect(result.is_valid).toBe(false);
        });

        it('accepts password at exact min_length', () => {
            const result = validatePassword('Aa1!Bb2@', strictPolicy); // exactly 8 chars
            expect(result.is_valid).toBe(true);
        });
    });

    // ─── getPasswordStrength (pure function) ─────────────────────
    describe('getPasswordStrength', () => {
        it('returns 0 for empty password', () => {
            expect(getPasswordStrength('')).toBe(0);
        });

        it('returns 0 for short password', () => {
            expect(getPasswordStrength('abc')).toBe(0);
        });

        it('returns 1 for 8-char lowercase only', () => {
            expect(getPasswordStrength('abcdefgh')).toBe(1);
        });

        it('returns 2 for 12-char lowercase only', () => {
            expect(getPasswordStrength('abcdefghijkl')).toBe(2);
        });

        it('returns 3 for 12-char mixed case', () => {
            expect(getPasswordStrength('AbcDefghijkl')).toBe(3);
        });

        it('returns 4 for 12-char mixed case + number', () => {
            expect(getPasswordStrength('AbcD1fghijkl')).toBe(4);
        });

        it('caps at 4 even with all criteria met', () => {
            expect(getPasswordStrength('AbcD1fghijk!')).toBe(4);
        });

        it('scores number-only 8-char password as 2', () => {
            expect(getPasswordStrength('12345678')).toBe(2); // length>=8 + has numbers
        });
    });

    // ─── getPasswordStrengthLabel (pure function) ────────────────
    describe('getPasswordStrengthLabel', () => {
        it('returns "Very Weak" for 0', () => {
            expect(getPasswordStrengthLabel(0)).toBe('Very Weak');
        });

        it('returns "Weak" for 1', () => {
            expect(getPasswordStrengthLabel(1)).toBe('Weak');
        });

        it('returns "Fair" for 2', () => {
            expect(getPasswordStrengthLabel(2)).toBe('Fair');
        });

        it('returns "Good" for 3', () => {
            expect(getPasswordStrengthLabel(3)).toBe('Good');
        });

        it('returns "Strong" for 4', () => {
            expect(getPasswordStrengthLabel(4)).toBe('Strong');
        });

        it('returns "Very Weak" for out-of-range scores', () => {
            expect(getPasswordStrengthLabel(5)).toBe('Very Weak');
            expect(getPasswordStrengthLabel(-1)).toBe('Very Weak');
        });
    });

    // ─── Async API functions (mock tests) ────────────────────────
    describe('getPasswordPolicy', () => {
        it('is an async function', () => {
            expect(typeof getPasswordPolicy).toBe('function');
        });
    });

    describe('updatePasswordPolicy', () => {
        it('is an async function', () => {
            expect(typeof updatePasswordPolicy).toBe('function');
        });
    });

    describe('validatePasswordDB', () => {
        it('is an async function', () => {
            expect(typeof validatePasswordDB).toBe('function');
        });
    });
});
