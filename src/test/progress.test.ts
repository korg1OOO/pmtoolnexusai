/**
 * progress Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Progress } from '@/components/ui/progress';

describe('progress', () => {
    it('exports Progress', () => {
        expect(Progress).toBeDefined();
    });
});
