/**
 * BriefingSectionCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { BriefingSectionCard } from '@/components/briefing/BriefingSectionCard';

describe('BriefingSectionCard', () => {
    it('exports the component', () => {
        expect(BriefingSectionCard).toBeDefined();
    });
});
