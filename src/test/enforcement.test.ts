/**
 * enforcement — Deep Tests
 * Tests checkLimit function with various scenarios
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

import { checkLimit } from '@/lib/enforcement';

describe('enforcement', () => {
    const mockInvoke = vi.mocked(supabase.functions.invoke);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('checkLimit', () => {
        it('resolves when function returns allowed', async () => {
            mockInvoke.mockResolvedValue({ data: { allowed: true }, error: null } as any);
            await expect(checkLimit('create_project')).resolves.toBeUndefined();
        });

        it('throws when function returns not allowed', async () => {
            mockInvoke.mockResolvedValue({
                data: { allowed: false, error: 'Subscription limit reached.' },
                error: null,
            } as any);
            await expect(checkLimit('create_project')).rejects.toThrow('Subscription limit reached.');
        });

        it('falls through silently when function is unreachable', async () => {
            mockInvoke.mockResolvedValue({ data: null, error: { message: 'Network error' } } as any);
            await expect(checkLimit('invite_member')).resolves.toBeUndefined();
        });

        it('falls through silently on non-limit error', async () => {
            mockInvoke.mockRejectedValue(new Error('CORS error'));
            await expect(checkLimit('upload_file')).resolves.toBeUndefined();
        });

        it('passes action and payload to invoke', async () => {
            mockInvoke.mockResolvedValue({ data: { allowed: true }, error: null } as any);
            await checkLimit('create_project', { extra: 'data' });
            expect(mockInvoke).toHaveBeenCalledWith('enforce-limits', {
                body: { action: 'create_project', payload: { extra: 'data' } },
            });
        });

        it('uses empty payload by default', async () => {
            mockInvoke.mockResolvedValue({ data: { allowed: true }, error: null } as any);
            await checkLimit('create_project');
            expect(mockInvoke).toHaveBeenCalledWith('enforce-limits', {
                body: { action: 'create_project', payload: {} },
            });
        });
    });
});
