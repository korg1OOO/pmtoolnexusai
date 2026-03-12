/**
 * DecisionsSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DecisionsSection } from '@/components/briefing/sections/DecisionsSection';

describe('DecisionsSection', () => {
    it('exports the component', () => {
        expect(DecisionsSection).toBeDefined();
    });
});
