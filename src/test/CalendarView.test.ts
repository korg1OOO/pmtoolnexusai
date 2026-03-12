/**
 * CalendarView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }) }));

import CalendarView from '@/components/views/CalendarView';

describe('CalendarView', () => {
    it('exports CalendarView', () => {
        expect(CalendarView).toBeDefined();
    });
});
