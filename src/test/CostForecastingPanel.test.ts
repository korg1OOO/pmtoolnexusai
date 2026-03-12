/**
 * CostForecastingPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import CostForecastingPanel from '@/components/views/MLAnalytics/CostForecastingPanel';

describe('CostForecastingPanel', () => {
    it('exports CostForecastingPanel', () => {
        expect(CostForecastingPanel).toBeDefined();
    });
});
