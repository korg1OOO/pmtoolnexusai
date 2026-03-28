/**
 * LinkedSpreadsheetIcon Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LinkedSpreadsheetIcon } from '@/components/notes/spreadsheet/LinkedSpreadsheetIcon';

describe('LinkedSpreadsheetIcon', () => {
    it('exports the component', () => {
        expect(LinkedSpreadsheetIcon).toBeDefined();
    });
});
