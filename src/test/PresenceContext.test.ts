/**
 * PresenceContext Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { PresenceProvider, usePresenceContext } from '@/contexts/PresenceContext';

describe('PresenceContext', () => {
    it('exports PresenceProvider', () => {
        expect(PresenceProvider).toBeDefined();
    });
    it('exports usePresenceContext', () => {
        expect(usePresenceContext).toBeDefined();
    });
});
