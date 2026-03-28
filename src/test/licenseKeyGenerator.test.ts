/**
 * License Key Generator — Deep Tests
 * Tests key generation, validation, bulk generation, tier info, CSV export, expiry
 */
import { describe, it, expect, vi } from 'vitest';

// Mock crypto for jsdom
const mockGetRandomValues = vi.fn((arr: Uint8Array) => {
    for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
    return arr;
});
vi.stubGlobal('crypto', {
    getRandomValues: mockGetRandomValues,
    subtle: { digest: vi.fn().mockResolvedValue(new ArrayBuffer(32)) },
});

import {
    generateLicenseKey,
    generateBulkLicenseKeys,
    validateLicenseKeyFormat,
    isLicenseKeyExpired,
    getLicenseKeyTierInfo,
    exportLicenseKeysToCSV,
} from '@/lib/licenseKeyGenerator';

describe('licenseKeyGenerator', () => {
    describe('generateLicenseKey', () => {
        it('generates a key in PROY-XXXX-XXXX-XXXX-XXXX format', () => {
            const key = generateLicenseKey();
            expect(key).toMatch(/^PROY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/);
        });

        it('generates unique keys on each call', () => {
            const keys = new Set(Array.from({ length: 10 }, () => generateLicenseKey()));
            expect(keys.size).toBe(10);
        });

        it('starts with PROY- prefix', () => {
            expect(generateLicenseKey().startsWith('PROY-')).toBe(true);
        });

        it('is exactly 24 characters long', () => {
            expect(generateLicenseKey().length).toBe(24);
        });
    });

    describe('validateLicenseKeyFormat', () => {
        it('validates correct format', () => {
            expect(validateLicenseKeyFormat('PROY-ABCD-EFGH-JKLM-NPQR')).toBe(true);
        });

        it('rejects lowercase', () => {
            expect(validateLicenseKeyFormat('PROY-abcd-efgh-jklm-npqr')).toBe(false);
        });

        it('rejects wrong prefix', () => {
            expect(validateLicenseKeyFormat('XYZW-ABCD-EFGH-JKLM-NPQR')).toBe(false);
        });

        it('rejects too short', () => {
            expect(validateLicenseKeyFormat('PROY-ABCD')).toBe(false);
        });

        it('rejects empty string', () => {
            expect(validateLicenseKeyFormat('')).toBe(false);
        });

        it('accepts generated keys', () => {
            const key = generateLicenseKey();
            expect(validateLicenseKeyFormat(key)).toBe(true);
        });
    });

    describe('generateBulkLicenseKeys', () => {
        it('generates the requested number of keys', () => {
            const keys = generateBulkLicenseKeys(5, { licenseType: 'pro' });
            expect(keys).toHaveLength(5);
        });

        it('each key has the correct license_type', () => {
            const keys = generateBulkLicenseKeys(3, { licenseType: 'business' });
            keys.forEach(k => expect(k.license_type).toBe('business'));
        });

        it('sets max_activations to 1 by default', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
            expect(keys[0].max_activations).toBe(1);
        });

        it('respects custom maxActivations', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'pro', maxActivations: 5 });
            expect(keys[0].max_activations).toBe(5);
        });

        it('sets expires_at when expiresInDays provided', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'trial', expiresInDays: 14 });
            expect(keys[0].expires_at).toBeTruthy();
            const expiry = new Date(keys[0].expires_at!);
            expect(expiry.getTime()).toBeGreaterThan(Date.now());
        });

        it('sets expires_at to null when expiresInDays not provided', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'lifetime' });
            expect(keys[0].expires_at).toBeNull();
        });

        it('sets source to "bulk_generation"', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
            expect(keys[0].source).toBe('bulk_generation');
        });

        it('includes key_prefix (first 13 chars)', () => {
            const keys = generateBulkLicenseKeys(1, { licenseType: 'pro' });
            expect(keys[0].key_prefix).toBe(keys[0].key.substring(0, 13));
        });
    });

    describe('isLicenseKeyExpired', () => {
        it('returns false when no expiry date', () => {
            expect(isLicenseKeyExpired(null)).toBe(false);
            expect(isLicenseKeyExpired(undefined)).toBe(false);
        });

        it('returns true for past date', () => {
            expect(isLicenseKeyExpired('2020-01-01T00:00:00Z')).toBe(true);
        });

        it('returns false for future date', () => {
            const future = new Date(Date.now() + 86400000).toISOString();
            expect(isLicenseKeyExpired(future)).toBe(false);
        });
    });

    describe('getLicenseKeyTierInfo', () => {
        it('returns info for trial', () => {
            const info = getLicenseKeyTierInfo('trial');
            expect(info.name).toBe('Trial');
            expect(info.duration).toBe('14 days');
        });

        it('returns info for pro', () => {
            expect(getLicenseKeyTierInfo('pro').name).toBe('Pro');
        });

        it('returns info for business', () => {
            expect(getLicenseKeyTierInfo('business').name).toBe('Business');
        });

        it('returns info for agency', () => {
            expect(getLicenseKeyTierInfo('agency').name).toBe('Agency');
        });

        it('returns info for enterprise', () => {
            expect(getLicenseKeyTierInfo('enterprise').name).toBe('Enterprise');
        });

        it('returns info for lifetime', () => {
            expect(getLicenseKeyTierInfo('lifetime').name).toBe('Lifetime');
            expect(getLicenseKeyTierInfo('lifetime').duration).toBe('Unlimited');
        });

        it('returns pro as default for unknown type', () => {
            expect(getLicenseKeyTierInfo('unknown').name).toBe('Pro');
        });

        it('each tier has a color', () => {
            ['trial', 'pro', 'business', 'agency', 'enterprise', 'lifetime'].forEach(tier => {
                expect(getLicenseKeyTierInfo(tier).color).toBeTruthy();
            });
        });
    });

    describe('exportLicenseKeysToCSV', () => {
        it('creates CSV with correct headers', () => {
            const csv = exportLicenseKeysToCSV([]);
            expect(csv).toContain('License Key,Type,Status,Assigned To,Activations,Expires,Created');
        });

        it('includes key data in rows', () => {
            const keys = [{
                key: 'PROY-TEST-TEST-TEST-TEST',
                license_type: 'pro',
                is_active: true,
                assigned_email: 'test@example.com',
                activation_count: 1,
                max_activations: 3,
                expires_at: null,
                created_at: '2024-01-01T00:00:00Z',
            }];
            const csv = exportLicenseKeysToCSV(keys);
            expect(csv).toContain('PROY-TEST-TEST-TEST-TEST');
            expect(csv).toContain('pro');
            expect(csv).toContain('Active');
            expect(csv).toContain('test@example.com');
            expect(csv).toContain('1/3');
            expect(csv).toContain('Never');
        });

        it('shows "Inactive" for non-active keys', () => {
            const keys = [{
                key: 'K', license_type: 'pro', is_active: false,
                assigned_email: null, activation_count: 0, max_activations: 1,
                expires_at: null, created_at: '2024-01-01',
            }];
            const csv = exportLicenseKeysToCSV(keys);
            expect(csv).toContain('Inactive');
        });

        it('shows "Unassigned" for unassigned keys', () => {
            const keys = [{
                key: 'K', license_type: 'pro', is_active: true,
                assigned_email: null, activation_count: 0, max_activations: 1,
                expires_at: null, created_at: '2024-01-01',
            }];
            const csv = exportLicenseKeysToCSV(keys);
            expect(csv).toContain('Unassigned');
        });
    });
});
