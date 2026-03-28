/**
 * LandingHeader Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LandingHeader } from '@/components/layout/LandingHeader';

describe('LandingHeader', () => {
    it('exports the component', () => {
        expect(LandingHeader).toBeDefined();
    });
});
