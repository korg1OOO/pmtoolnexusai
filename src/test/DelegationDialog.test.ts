/**
 * DelegationDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DelegationDialog from '@/components/governance/DelegationDialog';

describe('DelegationDialog', () => {
    it('exports DelegationDialog', () => {
        expect(DelegationDialog).toBeDefined();
    });
});
