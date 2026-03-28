/**
 * PieChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PieChartRenderer } from '@/components/notes/spreadsheet/charts/PieChartRenderer';

describe('PieChartRenderer', () => {
    it('exports the component', () => {
        expect(PieChartRenderer).toBeDefined();
    });
});
