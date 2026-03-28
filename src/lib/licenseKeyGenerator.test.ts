/**
 * Deep behavioral tests for licenseKeyGenerator
 * Tests: generateLicenseKey, validateLicenseKeyFormat, isLicenseKeyExpired,
 *        getLicenseKeyTierInfo, generateBulkLicenseKeys, exportLicenseKeysToCSV
 */
import { describe, it, expect } from 'vitest';
import {
    generateLicenseKey,
    validateLicenseKeyFormat,
    isLicenseKeyExpired,
    getLicenseKeyTierInfo,
    generateBulkLicenseKeys,
    exportLicenseKeysToCSV,
} from './licenseKeyGenerator';

describe('generateLicenseKey', () => {
    it('returns a string in PROY-XXXX-XXXX-XXXX-XXXX format', () => {
        const key = generateLicenseKey();
        expect(key).toMatch(/^PROY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
    });

    it('generates unique keys', () => {
        const keys = new Set<string>();
        for (let i = 0; i < 100; i++) {
            keys.add(generateLicenseKey());
        }
        expect(keys.size).toBe(100);
    });

    it('starts with PROY prefix', () => {
        const key = generateLicenseKey();
        expect(key.startsWith('PROY-')).toBe(true);
    });

    it('has correct length (24 chars)', () => {
        const key = generateLicenseKey();
        expect(key.length).toBe(24);
    });
});

describe('validateLicenseKeyFormat', () => {
    it('accepts valid key format', () => {
        expect(validateLicenseKeyFormat('PROY-ABCD-EFGH-JKLM-NPQR')).toBe(true);
    });

    it('rejects key without PROY prefix', () => {
        expect(validateLicenseKeyFormat('XXXX-ABCD-EFGH-JKLM-NPQR')).toBe(false);
    });

    it('rejects key with wrong segment length', () => {
        expect(validateLicenseKeyFormat('PROY-ABC-EFGH-JKLM-NPQR')).toBe(false);
    });

    it('rejects key with invalid chars (0, 1, O, I)', () => {
        expect(validateLicenseKeyFormat('PROY-0000-EFGH-JKLM-NPQR')).toBe(false);
        expect(validateLicenseKeyFormat('PROY-1111-EFGH-JKLM-NPQR')).toBe(false);
    });

    it('rejects lowercase keys', () => {
        expect(validateLicenseKeyFormat('PROY-abcd-efgh-jklm-npqr')).toBe(false);
    });

    it('rejects empty string', () => {
        expect(validateLicenseKeyFormat('')).toBe(false);
    });

    it('validates generated keys', () => {
        for (let i = 0; i < 10; i++) {
            expect(validateLicenseKeyFormat(generateLicenseKey())).toBe(true);
        }
    });
});

describe('isLicenseKeyExpired', () => {
    it('returns false for null/undefined', () => {
        expect(isLicenseKeyExpired(null)).toBe(false);
        expect(isLicenseKeyExpired(undefined)).toBe(false);
    });

    it('returns true for past date', () => {
        expect(isLicenseKeyExpired('2020-01-01')).toBe(true);
    });

    it('returns false for future date', () => {
        const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
        expect(isLicenseKeyExpired(futureDate)).toBe(false);
    });
});

describe('getLicenseKeyTierInfo', () => {
    it('returns trial info', () => {
        const info = getLicenseKeyTierInfo('trial');
        expect(info.name).toBe('Trial');
        expect(info.duration).toBe('14 days');
        expect(info.color).toBe('gray');
    });

    it('returns pro info', () => {
        const info = getLicenseKeyTierInfo('pro');
        expect(info.name).toBe('Pro');
        expect(info.color).toBe('green');
    });

    it('returns business info', () => {
        const info = getLicenseKeyTierInfo('business');
        expect(info.name).toBe('Business');
        expect(info.color).toBe('blue');
    });

    it('returns agency info', () => {
        const info = getLicenseKeyTierInfo('agency');
        expect(info.name).toBe('Agency');
        expect(info.color).toBe('purple');
    });

    it('returns enterprise info', () => {
        const info = getLicenseKeyTierInfo('enterprise');
        expect(info.name).toBe('Enterprise');
        expect(info.duration).toBe('Custom');
    });

    it('returns lifetime info', () => {
        const info = getLicenseKeyTierInfo('lifetime');
        expect(info.name).toBe('Lifetime');
        expect(info.duration).toBe('Unlimited');
        expect(info.color).toBe('gold');
    });

    it('defaults to pro for unknown type', () => {
        const info = getLicenseKeyTierInfo('unknown');
        expect(info.name).toBe('Pro');
    });
});

describe('generateBulkLicenseKeys', () => {
    it('generates correct count of keys', () => {
        const keys = generateBulkLicenseKeys(5, { licenseType: 'pro' });
        expect(keys).toHaveLength(5);
    });

    it('all keys have correct license type', () => {
        const keys = generateBulkLicenseKeys(3, { licenseType: 'business' });
        keys.forEach(k => expect(k.license_type).toBe('business'));
    });

    it('all keys have valid format', () => {
        const keys = generateBulkLicenseKeys(3, { licenseType: 'pro' });
        keys.forEach(k => expect(validateLicenseKeyFormat(k.key)).toBe(true));
    });

    it('sets expiration when expiresInDays provided', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'trial', expiresInDays: 14 });
        expect(keys[0].expires_at).not.toBeNull();
        const expiresAt = new Date(keys[0].expires_at!);
        const now = new Date();
        const diffDays = (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        expect(diffDays).toBeGreaterThan(13);
        expect(diffDays).toBeLessThan(15);
    });

    it('sets null expiration when no expiresInDays', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'lifetime' });
        expect(keys[0].expires_at).toBeNull();
    });

    it('sets default max_activations to 1', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
        expect(keys[0].max_activations).toBe(1);
    });

    it('uses custom max_activations', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'pro', maxActivations: 5 });
        expect(keys[0].max_activations).toBe(5);
    });

    it('includes key_prefix', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
        expect(keys[0].key_prefix).toBe(keys[0].key.substring(0, 13));
    });

    it('sets source as bulk_generation', () => {
        const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
        expect(keys[0].source).toBe('bulk_generation');
    });
});

describe('exportLicenseKeysToCSV', () => {
    it('generates CSV with headers', () => {
        const csv = exportLicenseKeysToCSV([]);
        const firstLine = csv.split('\n')[0];
        expect(firstLine).toContain('License Key');
        expect(firstLine).toContain('Type');
        expect(firstLine).toContain('Status');
    });

    it('includes key data in rows', () => {
        const keys = [{
            key: 'PROY-ABCD-EFGH-JKLM-NPQR',
            license_type: 'pro',
            is_active: true,
            assigned_email: 'test@example.com',
            activation_count: 1,
            max_activations: 3,
            expires_at: null,
            created_at: '2024-01-01T00:00:00Z',
        }];
        const csv = exportLicenseKeysToCSV(keys);
        const lines = csv.split('\n');
        expect(lines).toHaveLength(2);
        expect(lines[1]).toContain('PROY-ABCD-EFGH-JKLM-NPQR');
        expect(lines[1]).toContain('pro');
        expect(lines[1]).toContain('Active');
        expect(lines[1]).toContain('test@example.com');
        expect(lines[1]).toContain('1/3');
        expect(lines[1]).toContain('Never');
    });

    it('shows Inactive for inactive keys', () => {
        const keys = [{
            key: 'PROY-ABCD-EFGH-JKLM-NPQR',
            license_type: 'pro',
            is_active: false,
            assigned_email: null,
            activation_count: 0,
            max_activations: 1,
            expires_at: '2025-12-31T00:00:00Z',
            created_at: '2024-01-01T00:00:00Z',
        }];
        const csv = exportLicenseKeysToCSV(keys);
        expect(csv).toContain('Inactive');
        expect(csv).toContain('Unassigned');
    });
});
