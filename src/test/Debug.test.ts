/**
 * Debug Tests
 */
import { describe, it, expect, vi } from 'vitest';

import DebugPage from '@/pages/Debug';

describe('Debug', () => {
    it('exports DebugPage', () => {
        expect(DebugPage).toBeDefined();
    });
});
