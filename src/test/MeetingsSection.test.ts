/**
 * MeetingsSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MeetingsSection } from '@/components/briefing/sections/MeetingsSection';

describe('MeetingsSection', () => {
    it('exports the component', () => {
        expect(MeetingsSection).toBeDefined();
    });
});
