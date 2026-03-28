/**
 * LessonsLearnedView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import LessonsLearnedView from '@/components/views/LessonsLearnedView';

describe('LessonsLearnedView', () => {
    it('exports LessonsLearnedView', () => {
        expect(LessonsLearnedView).toBeDefined();
    });
});
