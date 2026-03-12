/**
 * Service tests batch 2: enforcement, passwordPolicyService DB, aiCreditsService
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { ms, ch } = vi.hoisted(() => {
    const s = { data: null as any, error: null as any, count: null as any };
    const c: any = {};
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { c[m] = vi.fn(() => c); });
    c.then = (res: any, rej?: any) => Promise.resolve({ data: s.data, error: s.error, count: s.count }).then(res, rej);
    return { ms: s, ch: c };
});

const mockFunctionsInvoke = vi.hoisted(() => vi.fn(() => Promise.resolve({ data: null, error: null })));
const mockRpc = vi.hoisted(() => vi.fn(() => Promise.resolve({ data: null, error: null })));

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        ...ch, from: ch.from,
        rpc: mockRpc,
        auth: { getUser: vi.fn(() => Promise.resolve({ data: { user: { id: 'u1' } }, error: null })) },
        channel: vi.fn(() => ({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })),
        removeChannel: vi.fn(),
        functions: { invoke: mockFunctionsInvoke },
    },
}));

import { checkLimit } from '@/lib/enforcement';
import * as pwdService from '@/services/passwordPolicyService';
import * as aiCreditsService from '@/services/aiCreditsService';

beforeEach(() => {
    ms.data = null; ms.error = null; ms.count = null;
    vi.clearAllMocks();
    ['from', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in', 'contains', 'order', 'limit', 'range', 'single', 'maybeSingle', 'filter', 'match', 'not', 'or', 'textSearch']
        .forEach(m => { ch[m].mockImplementation(() => ch); });
});

// =================== Enforcement ===================
describe('checkLimit', () => {
    it('passes when allowed', async () => {
        mockFunctionsInvoke.mockResolvedValue({ data: { allowed: true }, error: null });
        await expect(checkLimit('create_project')).resolves.toBeUndefined();
    });

    it('throws on subscription limit', async () => {
        mockFunctionsInvoke.mockResolvedValue({ data: { allowed: false, error: 'Subscription limit reached.' }, error: null });
        await expect(checkLimit('create_project')).rejects.toThrow('Subscription limit');
    });

    it('fails open on network error', async () => {
        mockFunctionsInvoke.mockResolvedValue({ data: null, error: { message: 'Network error' } });
        await expect(checkLimit('upload_file')).resolves.toBeUndefined();
    });

    it('sends action and payload', async () => {
        mockFunctionsInvoke.mockResolvedValue({ data: { allowed: true }, error: null });
        await checkLimit('invite_member', { email: 'test@t.com' });
        expect(mockFunctionsInvoke).toHaveBeenCalledWith('enforce-limits', {
            body: { action: 'invite_member', payload: { email: 'test@t.com' } },
        });
    });
});

// =================== PasswordPolicyService DB ===================
describe('passwordPolicyService DB', () => {
    it('getPasswordPolicy returns policy', async () => {
        ms.data = { id: 'x', min_length: 8 };
        const r = await pwdService.getPasswordPolicy();
        expect(r.min_length).toBe(8);
        expect(ch.from).toHaveBeenCalledWith('password_policies');
    });

    it('getPasswordPolicy throws', async () => {
        ms.error = { message: 'F' };
        await expect(pwdService.getPasswordPolicy()).rejects.toBeDefined();
    });

    it('updatePasswordPolicy', async () => {
        ms.data = { id: 'x', min_length: 12 };
        const r = await pwdService.updatePasswordPolicy({ min_length: 12 });
        expect(r.min_length).toBe(12);
    });

    it('validatePasswordDB', async () => {
        mockRpc.mockResolvedValue({ data: { is_valid: true, errors: [] }, error: null });
        const r = await pwdService.validatePasswordDB('Test123!');
        expect(mockRpc).toHaveBeenCalledWith('validate_password', { p_password: 'Test123!' });
        expect(r.is_valid).toBe(true);
    });
});

// =================== aiCreditsService ===================
describe('aiCreditsService', () => {
    it('module exports', () => {
        expect(aiCreditsService).toBeDefined();
        expect(Object.keys(aiCreditsService).length).toBeGreaterThan(0);
    });
});

// =================== passwordPolicyService pure function edge cases ===================
describe('validatePassword edge cases', () => {
    const basePolicy = {
        id: 'x', min_length: 1, require_uppercase: false, require_lowercase: false,
        require_numbers: false, require_special_chars: false,
        password_expiry_days: 0, prevent_reuse_count: 0, max_login_attempts: 5,
        lockout_duration_minutes: 15, created_at: '', updated_at: '',
    };

    it('all requirements disabled', () => {
        expect(pwdService.validatePassword('a', basePolicy).is_valid).toBe(true);
    });

    it('all requirements enabled', () => {
        const p = { ...basePolicy, min_length: 8, require_uppercase: true, require_lowercase: true, require_numbers: true, require_special_chars: true };
        const r = pwdService.validatePassword('Ab1!xxxx', p);
        expect(r.is_valid).toBe(true);
    });

    it('strength labels cover all ranges', () => {
        expect(pwdService.getPasswordStrengthLabel(0)).toBe('Very Weak');
        expect(pwdService.getPasswordStrengthLabel(1)).toBe('Weak');
        expect(pwdService.getPasswordStrengthLabel(2)).toBe('Fair');
        expect(pwdService.getPasswordStrengthLabel(3)).toBe('Good');
        expect(pwdService.getPasswordStrengthLabel(4)).toBe('Strong');
        expect(pwdService.getPasswordStrengthLabel(99)).toBe('Very Weak');
    });
});
