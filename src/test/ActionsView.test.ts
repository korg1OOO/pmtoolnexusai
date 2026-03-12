/**
 * ActionsView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ActionsView from '@/components/views/ActionsView';

describe('ActionsView', () => {
    it('exports ActionsView', () => {
        expect(ActionsView).toBeDefined();
    });
});
