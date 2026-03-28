/**
 * IssuesRegisterView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import IssuesRegisterView from '@/components/views/IssuesRegisterView';

describe('IssuesRegisterView', () => {
    it('exports IssuesRegisterView', () => {
        expect(IssuesRegisterView).toBeDefined();
    });
});
