/**
 * CalendarDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { CalendarDialog } from '@/components/planning/CalendarDialog';

describe('CalendarDialog', () => {
    it('exports the component', () => {
        expect(CalendarDialog).toBeDefined();
    });
});
