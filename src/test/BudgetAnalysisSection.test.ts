/**
 * BudgetAnalysisSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { BudgetAnalysisSection } from '@/components/briefing/sections/BudgetAnalysisSection';

describe('BudgetAnalysisSection', () => {
    it('exports the component', () => {
        expect(BudgetAnalysisSection).toBeDefined();
    });
});
