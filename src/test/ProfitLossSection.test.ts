/**
 * ProfitLossSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ProfitLossSection } from '@/components/briefing/sections/ProfitLossSection';

describe('ProfitLossSection', () => {
    it('exports the component', () => {
        expect(ProfitLossSection).toBeDefined();
    });
});
