/**
 * PaymentDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { PaymentDialog } from '@/components/credits/PaymentDialog';

describe('PaymentDialog', () => {
    it('exports the component', () => {
        expect(PaymentDialog).toBeDefined();
    });
});
