/**
 * EmbeddedDashboardWidget Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { EmbeddedDashboardWidget } from '@/components/presentations/EmbeddedDashboardWidget';

describe('EmbeddedDashboardWidget', () => {
    it('exports the component', () => {
        expect(EmbeddedDashboardWidget).toBeDefined();
    });
});
