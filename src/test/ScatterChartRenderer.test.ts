/**
 * ScatterChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ScatterChartRenderer } from '@/components/notes/spreadsheet/charts/ScatterChartRenderer';

describe('ScatterChartRenderer', () => {
    it('exports the component', () => {
        expect(ScatterChartRenderer).toBeDefined();
    });
});
