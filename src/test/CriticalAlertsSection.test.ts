/**
 * CriticalAlertsSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { CriticalAlertsSection } from '@/components/briefing/sections/CriticalAlertsSection';

describe('CriticalAlertsSection', () => {
    it('exports the component', () => {
        expect(CriticalAlertsSection).toBeDefined();
    });
});
