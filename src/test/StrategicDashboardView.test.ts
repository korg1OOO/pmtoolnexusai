/**
 * StrategicDashboardView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import StrategicDashboardView from '@/components/views/StrategicDashboardView';

describe('StrategicDashboardView', () => {
    it('exports StrategicDashboardView', () => {
        expect(StrategicDashboardView).toBeDefined();
    });
});
