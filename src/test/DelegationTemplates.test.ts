/**
 * DelegationTemplates Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DelegationTemplates from '@/components/governance/DelegationTemplates';

describe('DelegationTemplates', () => {
    it('exports DelegationTemplates', () => {
        expect(DelegationTemplates).toBeDefined();
    });
});
