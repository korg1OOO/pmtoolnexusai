/**
 * UsageDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { UsageDashboard } from '@/components/credits/UsageDashboard';

describe('UsageDashboard', () => {
    it('exports the component', () => {
        expect(UsageDashboard).toBeDefined();
    });
});
