/**
 * TeamAvailabilitySection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TeamAvailabilitySection } from '@/components/briefing/sections/TeamAvailabilitySection';

describe('TeamAvailabilitySection', () => {
    it('exports the component', () => {
        expect(TeamAvailabilitySection).toBeDefined();
    });
});
