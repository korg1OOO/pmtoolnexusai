/**
 * BarChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { BarChartRenderer } from '@/components/notes/spreadsheet/charts/BarChartRenderer';

describe('BarChartRenderer', () => {
    it('exports the component', () => {
        expect(BarChartRenderer).toBeDefined();
    });
});
