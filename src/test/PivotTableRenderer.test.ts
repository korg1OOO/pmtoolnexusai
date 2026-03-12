/**
 * PivotTableRenderer Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PivotTableRenderer } from '@/components/notes/spreadsheet/pivot/PivotTableRenderer';

describe('PivotTableRenderer', () => {
    it('exports the component', () => {
        expect(PivotTableRenderer).toBeDefined();
    });
});
