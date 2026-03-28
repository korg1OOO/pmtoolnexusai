/**
 * DeliverablesView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DeliverablesView from '@/components/views/DeliverablesView';

describe('DeliverablesView', () => {
    it('exports DeliverablesView', () => {
        expect(DeliverablesView).toBeDefined();
    });
});
