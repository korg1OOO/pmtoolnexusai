/**
 * ProjectPlanView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ProjectPlanView from '@/components/views/ProjectPlanView';

describe('ProjectPlanView', () => {
    it('exports ProjectPlanView', () => {
        expect(ProjectPlanView).toBeDefined();
    });
});
