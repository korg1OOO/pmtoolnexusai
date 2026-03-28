/**
 * calendar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Calendar } from '@/components/ui/calendar';

describe('calendar', () => {
    it('exports Calendar', () => {
        expect(Calendar).toBeDefined();
    });
});
