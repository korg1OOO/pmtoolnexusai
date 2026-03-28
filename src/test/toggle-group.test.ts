/**
 * toggle-group Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

describe('toggle-group', () => {
    it('exports ToggleGroup', () => {
        expect(ToggleGroup).toBeDefined();
    });
    it('exports ToggleGroupItem', () => {
        expect(ToggleGroupItem).toBeDefined();
    });
});
