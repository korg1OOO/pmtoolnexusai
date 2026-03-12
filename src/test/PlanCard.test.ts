/**
 * PlanCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PlanCard } from '@/components/admin/plans/PlanCard';

describe('PlanCard', () => {
    it('exports the component', () => {
        expect(PlanCard).toBeDefined();
    });
});
