/**
 * offlineQueue Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { offlineQueue } from '@/utils/offlineQueue';

describe('offlineQueue', () => {
    it('exports offlineQueue', () => {
        expect(offlineQueue).toBeDefined();
    });
});
