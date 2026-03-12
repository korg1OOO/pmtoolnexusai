/**
 * ResourcesView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ResourcesView from '@/components/views/ResourcesView';

describe('ResourcesView', () => {
    it('exports ResourcesView', () => {
        expect(ResourcesView).toBeDefined();
    });
});
