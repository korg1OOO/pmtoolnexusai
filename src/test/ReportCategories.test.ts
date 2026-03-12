/**
 * ReportCategories Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ReportCategories } from '@/components/reports/ReportCategories';

describe('ReportCategories', () => {
    it('exports the component', () => {
        expect(ReportCategories).toBeDefined();
    });
});
