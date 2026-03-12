/**
 * ScenariosView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import ScenariosView from '@/components/views/ScenariosView';

describe('ScenariosView', () => {
    it('exports ScenariosView', () => {
        expect(ScenariosView).toBeDefined();
    });
});
