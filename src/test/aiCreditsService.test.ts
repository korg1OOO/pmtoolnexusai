/**
 * Integration Tests: AI Credits Service - Graceful Error Handling
 * Verifies that the service returns safe defaults when ai_credits table is missing
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase with table-missing error scenarios
const mockFrom = vi.fn();
const mockRpc = vi.fn();
const mockGetUser = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        auth: {
            getUser: () => mockGetUser(),
        },
        from: (...args: any[]) => mockFrom(...args),
        rpc: (...args: any[]) => mockRpc(...args),
    },
}));

import { aiCreditsService, CreditBalance } from '@/services/aiCreditsService';

describe('AICreditsService - Graceful Error Handling', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockGetUser.mockResolvedValue({ data: { user: { id: 'test-user-123' } } });
    });

    describe('getBalance', () => {
        it('returns default balance when ai_credits table does not exist (406)', async () => {
            // Simulate 406 Not Acceptable (table missing)
            mockFrom.mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: vi.fn().mockResolvedValue({
                    data: null,
                    error: { code: '42P01', message: 'relation "ai_credits" does not exist' }
                }),
            });

            // Mock user_tenants for getCurrentTenantId
            mockFrom.mockImplementation((table: string) => {
                if (table === 'user_tenants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { tenant_id: 'test-tenant' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: '42P01', message: 'relation "ai_credits" does not exist' }
                    }),
                };
            });

            const balance = await aiCreditsService.getBalance();

            expect(balance).toBeDefined();
            expect(balance.id).toBe('default');
            expect(balance.total_credits).toBe(0);
            expect(balance.used_credits).toBe(0);
            expect(balance.available_credits).toBe(0);
        });

        it('returns default balance when 406 Not Acceptable is returned', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'user_tenants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { tenant_id: 'test-tenant' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: '406', message: 'Not Acceptable' }
                    }),
                };
            });

            const balance = await aiCreditsService.getBalance();

            expect(balance).toBeDefined();
            expect(balance.total_credits).toBe(0);
        });

        it('returns default balance when user is not authenticated', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const balance = await aiCreditsService.getBalance();

            expect(balance).toBeDefined();
            expect(balance.id).toBe('default');
            expect(balance.user_id).toBe('unknown');
        });

        it('falls back to defaults when initialize_ai_credits RPC fails', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'user_tenants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { tenant_id: 'test-tenant' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116', message: 'No rows' }
                    }),
                };
            });

            // RPC also fails (function doesn't exist)
            mockRpc.mockResolvedValue({
                data: null,
                error: { code: '42883', message: 'function initialize_ai_credits does not exist' }
            });

            const balance = await aiCreditsService.getBalance();

            expect(balance).toBeDefined();
            expect(balance.total_credits).toBe(0);
        });

        it('returns real balance when table exists and has data', async () => {
            const mockBalance: CreditBalance = {
                id: 'real-id',
                tenant_id: 'tenant-1',
                user_id: 'test-user-123',
                total_credits: 1000,
                used_credits: 250,
                available_credits: 750,
                low_balance_threshold: 50,
                auto_recharge_enabled: false,
                auto_recharge_amount: 100,
                auto_recharge_threshold: 10,
                last_recharged_at: null,
                created_at: '2026-01-01',
                updated_at: '2026-01-01',
            };

            mockFrom.mockImplementation((table: string) => {
                if (table === 'user_tenants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { tenant_id: 'tenant-1' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: mockBalance,
                        error: null
                    }),
                };
            });

            const balance = await aiCreditsService.getBalance();

            expect(balance.id).toBe('real-id');
            expect(balance.total_credits).toBe(1000);
            expect(balance.available_credits).toBe(750);
        });
    });

    describe('hasCredits', () => {
        it('returns false when table does not exist (graceful)', async () => {
            mockFrom.mockImplementation((table: string) => {
                if (table === 'user_tenants') {
                    return {
                        select: vi.fn().mockReturnThis(),
                        eq: vi.fn().mockReturnThis(),
                        limit: vi.fn().mockReturnThis(),
                        single: vi.fn().mockResolvedValue({
                            data: { tenant_id: 'test-tenant' },
                            error: null,
                        }),
                    };
                }
                return {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn().mockResolvedValue({
                        data: null,
                        error: { code: '42P01', message: 'table not found' }
                    }),
                };
            });

            const result = await aiCreditsService.hasCredits(1);

            // Should return false (0 available credits from default), not throw
            expect(result).toBe(false);
        });
    });
});
