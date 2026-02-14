/**
 * Password Policy Service
 * Manages password policy configuration and validation
 */

import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface PasswordPolicy {
    id: string;
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_special_chars: boolean;
    password_expiry_days: number;
    prevent_reuse_count: number;
    max_login_attempts: number;
    lockout_duration_minutes: number;
    created_at: string;
    updated_at: string;
}

export interface PasswordValidationResult {
    is_valid: boolean;
    errors: string[];
}

/**
 * Get current password policy
 */
export async function getPasswordPolicy(): Promise<PasswordPolicy> {
    const { data, error } = await supabase
        .from('password_policies')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

    if (error) throw error;
    return data as PasswordPolicy;
}

/**
 * Update password policy
 */
export async function updatePasswordPolicy(updates: Partial<PasswordPolicy>): Promise<PasswordPolicy> {
    const { data, error } = await supabase
        .from('password_policies')
        .update(updates)
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .select()
        .single();

    if (error) throw error;
    return data as PasswordPolicy;
}

/**
 * Validate password against current policy (database function)
 */
export async function validatePasswordDB(password: string): Promise<PasswordValidationResult> {
    const { data, error } = await supabase.rpc('validate_password', {
        p_password: password,
    });

    if (error) throw error;
    return data as PasswordValidationResult;
}

/**
 * Validate password against policy (client-side)
 */
export function validatePassword(password: string, policy: PasswordPolicy): PasswordValidationResult {
    const errors: string[] = [];

    if (password.length < policy.min_length) {
        errors.push(`Password must be at least ${policy.min_length} characters long`);
    }

    if (policy.require_uppercase && !/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
    }

    if (policy.require_lowercase && !/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
    }

    if (policy.require_numbers && !/[0-9]/.test(password)) {
        errors.push('Password must contain at least one number');
    }

    if (policy.require_special_chars && !/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must contain at least one special character');
    }

    return {
        is_valid: errors.length === 0,
        errors,
    };
}

/**
 * Get password strength score (0-4)
 */
export function getPasswordStrength(password: string): number {
    let score = 0;

    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    return Math.min(score, 4);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(score: number): string {
    const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return labels[score] || 'Very Weak';
}
