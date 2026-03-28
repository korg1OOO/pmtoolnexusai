/**
 * MiniCalendarSidebar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MiniCalendarSidebar } from '@/components/meetings/MiniCalendarSidebar';

describe('MiniCalendarSidebar', () => {
    it('exports the component', () => {
        expect(MiniCalendarSidebar).toBeDefined();
    });
});
