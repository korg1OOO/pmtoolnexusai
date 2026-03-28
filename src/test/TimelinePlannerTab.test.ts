/**
 * TimelinePlannerTab Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import TimelinePlannerTab from '@/components/views/TimelinePlannerTab';

describe('TimelinePlannerTab', () => {
    it('exports TimelinePlannerTab', () => {
        expect(TimelinePlannerTab).toBeDefined();
    });
});
