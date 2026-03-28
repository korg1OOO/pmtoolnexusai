/**
 * AdminBillingDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminBillingDashboard } from '@/components/admin/pages/AdminBillingDashboard';

describe('AdminBillingDashboard', () => {
    it('exports the component', () => {
        expect(AdminBillingDashboard).toBeDefined();
    });
});
