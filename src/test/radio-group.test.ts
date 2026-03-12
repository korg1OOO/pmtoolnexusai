/**
 * radio-group Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

describe('radio-group', () => {
    it('exports RadioGroup', () => {
        expect(RadioGroup).toBeDefined();
    });
    it('exports RadioGroupItem', () => {
        expect(RadioGroupItem).toBeDefined();
    });
});
