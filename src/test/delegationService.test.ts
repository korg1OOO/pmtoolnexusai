/**
 * delegationService — Deep Tests
 * Tests all exported function shapes
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            or: vi.fn().mockReturnThis(),
            lt: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
    },
}));
vi.mock('@/types/analytics', () => ({}));

import {
    createDelegation,
    bulkDelegateApprovals,
    saveDelegationTemplate,
    getDelegationTemplates,
    applyDelegationTemplate,
    deleteDelegationTemplate,
    getDelegationHistory,
    canSubDelegate,
    createSubDelegation,
    checkExpiredDelegations,
    extendDelegation,
    revokeDelegation,
    getActiveDelegations,
    searchUsersForDelegation,
} from '@/services/delegationService';

describe('delegationService', () => {
    const methods = {
        createDelegation,
        bulkDelegateApprovals,
        saveDelegationTemplate,
        getDelegationTemplates,
        applyDelegationTemplate,
        deleteDelegationTemplate,
        getDelegationHistory,
        canSubDelegate,
        createSubDelegation,
        checkExpiredDelegations,
        extendDelegation,
        revokeDelegation,
        getActiveDelegations,
        searchUsersForDelegation,
    };

    Object.entries(methods).forEach(([name, fn]) => {
        it(`${name} is an exported function`, () => {
            expect(typeof fn).toBe('function');
        });
    });
});
