/**
 * RequirementsMatrixView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import RequirementsMatrixView from '@/components/views/RequirementsMatrixView';

describe('RequirementsMatrixView', () => {
    it('exports RequirementsMatrixView', () => {
        expect(RequirementsMatrixView).toBeDefined();
    });
});
