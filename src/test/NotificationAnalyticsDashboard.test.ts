/**
 * NotificationAnalyticsDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { NotificationAnalyticsDashboard } from '@/components/admin/analytics/NotificationAnalyticsDashboard';

describe('NotificationAnalyticsDashboard', () => {
    it('exports the component', () => {
        expect(NotificationAnalyticsDashboard).toBeDefined();
    });
});
