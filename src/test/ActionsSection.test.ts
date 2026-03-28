/**
 * ActionsSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ActionsSection } from '@/components/briefing/sections/ActionsSection';

describe('ActionsSection', () => {
    it('exports the component', () => {
        expect(ActionsSection).toBeDefined();
    });
});
