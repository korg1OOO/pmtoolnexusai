/**
 * useConfirmDialog Hook Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { useConfirmDialog } from '@/hooks/useConfirmDialog';

describe('useConfirmDialog', () => {
    describe('exports', () => {
        it('exports all expected items', () => {
            expect(useConfirmDialog).toBeDefined();
        });
    });

});
