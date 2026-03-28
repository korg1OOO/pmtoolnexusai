/**
 * DecisionsView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DecisionsView from '@/components/views/DecisionsView';

describe('DecisionsView', () => {
    it('exports DecisionsView', () => {
        expect(DecisionsView).toBeDefined();
    });
});
