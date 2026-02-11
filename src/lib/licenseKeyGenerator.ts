/**
 * License Key Generator Utility
 * Generates and validates license keys for ProjectOye
 * Uses Web Crypto API for browser compatibility
 */

export interface LicenseKeyConfig {
    licenseType: 'trial' | 'pro' | 'business' | 'agency' | 'enterprise' | 'lifetime';
    expiresInDays?: number;
    maxActivations?: number;
    assignedEmail?: string;
    createdBy?: string;
    notes?: string;
}

/**
 * Generate a single license key
 */
export function generateLicenseKey(): string {
    // Generate random bytes using Web Crypto API
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);

    // Convert to base32-like encoding (easier to type for users)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar characters (0,O,I,1)
    let key = '';

    for (let i = 0; i < 16; i++) {
        key += chars[array[i] % chars.length];
    }

    // Format: PROY-XXXX-XXXX-XXXX-XXXX
    return `PROY-${key.slice(0, 4)}-${key.slice(4, 8)}-${key.slice(8, 12)}-${key.slice(12, 16)}`;
}

/**
 * Generate multiple license keys
 */
export function generateBulkLicenseKeys(count: number, config: LicenseKeyConfig) {
    const keys = [];
    const expiresAt = config.expiresInDays
        ? new Date(Date.now() + config.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

    for (let i = 0; i < count; i++) {
        const key = generateLicenseKey();
        keys.push({
            key,
            key_prefix: key.substring(0, 13), // "PROY-XXXX-XXX"
            license_type: config.licenseType,
            max_activations: config.maxActivations || 1,
            assigned_email: config.assignedEmail,
            expires_at: expiresAt,
            notes: config.notes,
            created_by: config.createdBy,
            source: 'bulk_generation',
        });
    }

    return keys;
}

/**
 * Validate license key format
 */
export function validateLicenseKeyFormat(key: string): boolean {
    // PROY-XXXX-XXXX-XXXX-XXXX format
    const regex = /^PROY-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}-[A-Z2-9]{4}$/;
    return regex.test(key);
}

/**
 * Generate device fingerprint using Web Crypto API
 */
export async function generateDeviceFingerprint(data: {
    userAgent?: string;
    platform?: string;
    language?: string;
    screenResolution?: string;
}): Promise<string> {
    const fingerprintString = JSON.stringify(data);
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if license key is expired
 */
export function isLicenseKeyExpired(expiresAt?: string | null): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
}

/**
 * Get license key tier details
 */
export function getLicenseKeyTierInfo(licenseType: string) {
    const tierInfo: Record<string, { name: string; duration: string; color: string }> = {
        trial: { name: 'Trial', duration: '14 days', color: 'gray' },
        pro: { name: 'Pro', duration: '1 year', color: 'green' },
        business: { name: 'Business', duration: '1 year', color: 'blue' },
        agency: { name: 'Agency', duration: '1 year', color: 'purple' },
        enterprise: { name: 'Enterprise', duration: 'Custom', color: 'orange' },
        lifetime: { name: 'Lifetime', duration: 'Unlimited', color: 'gold' },
    };

    return tierInfo[licenseType] || tierInfo.pro;
}

/**
 * Export license keys to CSV
 */
export function exportLicenseKeysToCSV(keys: any[]): string {
    const headers = ['License Key', 'Type', 'Status', 'Assigned To', 'Activations', 'Expires', 'Created'];
    const rows = keys.map(key => [
        key.key,
        key.license_type,
        key.is_active ? 'Active' : 'Inactive',
        key.assigned_email || 'Unassigned',
        `${key.activation_count}/${key.max_activations}`,
        key.expires_at ? new Date(key.expires_at).toLocaleDateString() : 'Never',
        new Date(key.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    return csv;
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
