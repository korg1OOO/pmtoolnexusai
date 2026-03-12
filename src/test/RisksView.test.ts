/**
 * RisksView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import RisksView from '@/components/views/RisksView';

describe('RisksView', () => {
    it('exports RisksView', () => {
        expect(RisksView).toBeDefined();
    });
});
