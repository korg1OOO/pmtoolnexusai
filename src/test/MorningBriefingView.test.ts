/**
 * MorningBriefingView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import MorningBriefingView from '@/components/views/MorningBriefingView';

describe('MorningBriefingView', () => {
    it('exports MorningBriefingView', () => {
        expect(MorningBriefingView).toBeDefined();
    });
});
