/**
 * PivotOverlay Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PivotOverlay } from '@/components/notes/spreadsheet/pivot/PivotOverlay';

describe('PivotOverlay', () => {
    it('exports the component', () => {
        expect(PivotOverlay).toBeDefined();
    });
});
