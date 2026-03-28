/**
 * VarianceTable Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { VarianceTable } from '@/components/tracking/VarianceTable';

describe('VarianceTable', () => {
    it('exports the component', () => {
        expect(VarianceTable).toBeDefined();
    });
});
