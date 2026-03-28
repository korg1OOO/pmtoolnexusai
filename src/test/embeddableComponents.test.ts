/**
 * embeddableComponents Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { embeddableComponents, getComponentsByCategory, getComponentById, getComponentsByType, getRefreshableComponents, categoryLabels, typeLabels } from '@/lib/embeddableComponents';

describe('embeddableComponents', () => {
    it('exports embeddableComponents', () => {
        expect(embeddableComponents).toBeDefined();
    });
    it('exports getComponentsByCategory', () => {
        expect(getComponentsByCategory).toBeDefined();
    });
    it('exports getComponentById', () => {
        expect(getComponentById).toBeDefined();
    });
    it('exports getComponentsByType', () => {
        expect(getComponentsByType).toBeDefined();
    });
    it('exports getRefreshableComponents', () => {
        expect(getRefreshableComponents).toBeDefined();
    });
    it('exports categoryLabels', () => {
        expect(categoryLabels).toBeDefined();
    });
    it('exports typeLabels', () => {
        expect(typeLabels).toBeDefined();
    });
});
