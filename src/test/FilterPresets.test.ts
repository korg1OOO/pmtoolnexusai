/**
 * FilterPresets Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { FilterPresets } from '@/components/analytics/filters/FilterPresets';

describe('FilterPresets', () => {
    it('exports the component', () => {
        expect(FilterPresets).toBeDefined();
    });
});
