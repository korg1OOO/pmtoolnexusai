/**
 * FeaturesSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { FeaturesSection } from '@/components/landing/FeaturesSection';

describe('FeaturesSection', () => {
    it('exports the component', () => {
        expect(FeaturesSection).toBeDefined();
    });
});
