/**
 * PresentationToolbar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PresentationToolbar } from '@/components/presentations/PresentationToolbar';

describe('PresentationToolbar', () => {
    it('exports the component', () => {
        expect(PresentationToolbar).toBeDefined();
    });
});
