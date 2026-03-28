/**
 * templateData Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { projectTemplates, templateCategories, methodologyOptions } from '@/data/templateData';

describe('templateData', () => {
    it('exports projectTemplates', () => {
        expect(projectTemplates).toBeDefined();
    });
    it('exports templateCategories', () => {
        expect(templateCategories).toBeDefined();
    });
    it('exports methodologyOptions', () => {
        expect(methodologyOptions).toBeDefined();
    });
});
