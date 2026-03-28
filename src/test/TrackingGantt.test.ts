/**
 * TrackingGantt Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TrackingGantt } from '@/components/tracking/TrackingGantt';

describe('TrackingGantt', () => {
    it('exports the component', () => {
        expect(TrackingGantt).toBeDefined();
    });
});
