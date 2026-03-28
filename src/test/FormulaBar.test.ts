/**
 * FormulaBar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { FormulaBar } from '@/components/notes/spreadsheet/FormulaBar';

describe('FormulaBar', () => {
    it('exports the component', () => {
        expect(FormulaBar).toBeDefined();
    });
});
