/**
 * NavLink Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { NavLink } from '@/components/NavLink';

describe('NavLink', () => {
    it('exports the component', () => {
        expect(NavLink).toBeDefined();
    });
});
