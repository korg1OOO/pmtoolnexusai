/**
 * ScheduleSlippageSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ScheduleSlippageSection } from '@/components/briefing/sections/ScheduleSlippageSection';

describe('ScheduleSlippageSection', () => {
    it('exports the component', () => {
        expect(ScheduleSlippageSection).toBeDefined();
    });
});
