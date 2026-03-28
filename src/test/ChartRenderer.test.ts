/**
 * ChartRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ChartRenderer } from '@/components/notes/spreadsheet/charts/ChartRenderer';

describe('ChartRenderer', () => {
    it('exports the component', () => {
        expect(ChartRenderer).toBeDefined();
    });
});
