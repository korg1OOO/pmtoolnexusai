/**
 * RefundDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { RefundDialog } from '@/components/admin/billing/RefundDialog';

describe('RefundDialog', () => {
    it('exports the component', () => {
        expect(RefundDialog).toBeDefined();
    });
});
