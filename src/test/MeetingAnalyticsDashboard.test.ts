/**
 * MeetingAnalyticsDashboard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { MeetingAnalyticsDashboard } from '@/components/analytics/MeetingAnalyticsDashboard';

describe('MeetingAnalyticsDashboard', () => {
    it('exports the component', () => {
        expect(MeetingAnalyticsDashboard).toBeDefined();
    });
});
