/**
 * ProgramInsightsDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { ProgramInsightsDashboard } from '@/components/analytics/ProgramInsightsDashboard';

describe('ProgramInsightsDashboard', () => {
    it('exports the component', () => {
        expect(ProgramInsightsDashboard).toBeDefined();
    });
});
