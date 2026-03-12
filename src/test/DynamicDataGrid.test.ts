/**
 * DynamicDataGrid Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DynamicDataGrid } from '@/components/ui/DynamicDataGrid';

describe('DynamicDataGrid', () => {
    it('exports the component', () => {
        expect(DynamicDataGrid).toBeDefined();
    });
});
