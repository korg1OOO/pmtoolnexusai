/**
 * StakeholderRegisterView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import StakeholderRegisterView from '@/components/views/StakeholderRegisterView';

describe('StakeholderRegisterView', () => {
    it('exports StakeholderRegisterView', () => {
        expect(StakeholderRegisterView).toBeDefined();
    });
});
