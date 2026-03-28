/**
 * PivotDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PivotDialog } from '@/components/notes/spreadsheet/pivot/PivotDialog';

describe('PivotDialog', () => {
    it('exports the component', () => {
        expect(PivotDialog).toBeDefined();
    });
});
