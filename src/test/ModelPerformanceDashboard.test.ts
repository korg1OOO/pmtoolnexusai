/**
 * ModelPerformanceDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ModelPerformanceDashboard from '@/components/views/MLAnalytics/ModelPerformanceDashboard';

describe('ModelPerformanceDashboard', () => {
    it('exports ModelPerformanceDashboard', () => {
        expect(ModelPerformanceDashboard).toBeDefined();
    });
});
