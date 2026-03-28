/**
 * BacklinksSidebar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { BacklinksSidebar } from '@/components/notes/BacklinksSidebar';

describe('BacklinksSidebar', () => {
    it('exports the component', () => {
        expect(BacklinksSidebar).toBeDefined();
    });
});
