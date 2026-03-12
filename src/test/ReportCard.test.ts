/**
 * ReportCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ReportCard } from '@/components/reports/ReportCard';

describe('ReportCard', () => {
    it('exports the component', () => {
        expect(ReportCard).toBeDefined();
    });
});
