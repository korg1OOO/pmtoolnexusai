/**
 * MilestonesView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import MilestonesView from '@/components/views/MilestonesView';

describe('MilestonesView', () => {
    it('exports MilestonesView', () => {
        expect(MilestonesView).toBeDefined();
    });
});
