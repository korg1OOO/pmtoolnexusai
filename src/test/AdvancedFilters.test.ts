/**
 * AdvancedFilters Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdvancedFilters } from '@/components/analytics/filters/AdvancedFilters';

describe('AdvancedFilters', () => {
    it('exports the component', () => {
        expect(AdvancedFilters).toBeDefined();
    });
});
