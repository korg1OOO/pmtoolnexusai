/**
 * SubscriptionAnalyticsDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SubscriptionAnalyticsDashboard } from '@/components/subscription/SubscriptionAnalyticsDashboard';

describe('SubscriptionAnalyticsDashboard', () => {
    it('exports the component', () => {
        expect(SubscriptionAnalyticsDashboard).toBeDefined();
    });
});
