/**
 * MultiSelectFilter Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MultiSelectFilter } from '@/components/analytics/filters/MultiSelectFilter';

describe('MultiSelectFilter', () => {
    it('exports the component', () => {
        expect(MultiSelectFilter).toBeDefined();
    });
});
