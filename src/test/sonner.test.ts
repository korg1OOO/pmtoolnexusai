/**
 * sonner Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import { Toaster, toast } from '@/components/ui/sonner';

describe('sonner', () => {
    it('exports Toaster', () => {
        expect(Toaster).toBeDefined();
    });
    it('exports toast', () => {
        expect(toast).toBeDefined();
    });
});
