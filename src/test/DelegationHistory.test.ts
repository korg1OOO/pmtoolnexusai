/**
 * DelegationHistory Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DelegationHistory from '@/components/governance/DelegationHistory';

describe('DelegationHistory', () => {
    it('exports DelegationHistory', () => {
        expect(DelegationHistory).toBeDefined();
    });
});
