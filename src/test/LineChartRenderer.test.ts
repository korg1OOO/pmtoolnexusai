/**
 * LineChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LineChartRenderer } from '@/components/notes/spreadsheet/charts/LineChartRenderer';

describe('LineChartRenderer', () => {
    it('exports the component', () => {
        expect(LineChartRenderer).toBeDefined();
    });
});
