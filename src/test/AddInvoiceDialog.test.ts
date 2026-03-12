/**
 * AddInvoiceDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AddInvoiceDialog } from '@/components/financials/AddInvoiceDialog';

describe('AddInvoiceDialog', () => {
    it('exports the component', () => {
        expect(AddInvoiceDialog).toBeDefined();
    });
});
