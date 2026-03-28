/**
 * SpreadsheetToolbar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SpreadsheetToolbar } from '@/components/notes/spreadsheet/SpreadsheetToolbar';

describe('SpreadsheetToolbar', () => {
    it('exports the component', () => {
        expect(SpreadsheetToolbar).toBeDefined();
    });
});
