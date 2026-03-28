/**
 * AddBudgetItemDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AddBudgetItemDialog } from '@/components/financials/AddBudgetItemDialog';

describe('AddBudgetItemDialog', () => {
    it('exports the component', () => {
        expect(AddBudgetItemDialog).toBeDefined();
    });
});
