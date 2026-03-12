/**
 * use-toast Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { toast, useToast } from '@/hooks/use-toast';

describe('use-toast', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(toast).toBeDefined();
            expect(useToast).toBeDefined();
        });
    });

});

