/**
 * ChangeRequestsView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ChangeRequestsView from '@/components/views/ChangeRequestsView';

describe('ChangeRequestsView', () => {
    it('exports ChangeRequestsView', () => {
        expect(ChangeRequestsView).toBeDefined();
    });
});
