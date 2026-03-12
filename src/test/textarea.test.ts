/**
 * textarea Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Textarea } from '@/components/ui/textarea';

describe('textarea', () => {
    it('exports Textarea', () => {
        expect(Textarea).toBeDefined();
    });
});
