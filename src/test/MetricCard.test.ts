/**
 * MetricCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MetricCard } from '@/components/admin/components/MetricCard';

describe('MetricCard', () => {
    it('exports the component', () => {
        expect(MetricCard).toBeDefined();
    });
});
