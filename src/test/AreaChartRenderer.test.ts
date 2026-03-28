/**
 * AreaChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AreaChartRenderer } from '@/components/notes/spreadsheet/charts/AreaChartRenderer';

describe('AreaChartRenderer', () => {
    it('exports the component', () => {
        expect(AreaChartRenderer).toBeDefined();
    });
});
