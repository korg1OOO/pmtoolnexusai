/**
 * TemplatesAdminView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import TemplatesAdminView from '@/components/views/TemplatesAdminView';

describe('TemplatesAdminView', () => {
    it('exports TemplatesAdminView', () => {
        expect(TemplatesAdminView).toBeDefined();
    });
});
