/**
 * LandingFooter Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LandingFooter } from '@/components/layout/LandingFooter';

describe('LandingFooter', () => {
    it('exports the component', () => {
        expect(LandingFooter).toBeDefined();
    });
});
