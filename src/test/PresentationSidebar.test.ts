/**
 * PresentationSidebar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PresentationSidebar } from '@/components/presentations/PresentationSidebar';

describe('PresentationSidebar', () => {
    it('exports the component', () => {
        expect(PresentationSidebar).toBeDefined();
    });
});
