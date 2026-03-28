/**
 * DocumentCenterView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import DocumentCenterView from '@/components/views/DocumentCenterView';

describe('DocumentCenterView', () => {
    it('exports DocumentCenterView', () => {
        expect(DocumentCenterView).toBeDefined();
    });
});
