/**
 * ChartOverlay Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ChartOverlay } from '@/components/notes/spreadsheet/charts/ChartOverlay';

describe('ChartOverlay', () => {
    it('exports the component', () => {
        expect(ChartOverlay).toBeDefined();
    });
});
