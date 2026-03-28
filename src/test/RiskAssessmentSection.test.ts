/**
 * RiskAssessmentSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { RiskAssessmentSection } from '@/components/briefing/sections/RiskAssessmentSection';

describe('RiskAssessmentSection', () => {
    it('exports the component', () => {
        expect(RiskAssessmentSection).toBeDefined();
    });
});
