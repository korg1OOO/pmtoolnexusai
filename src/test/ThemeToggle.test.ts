/**
 * ThemeToggle Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ThemeToggle } from '@/components/ThemeToggle';

describe('ThemeToggle', () => {
    it('exports the component', () => {
        expect(ThemeToggle).toBeDefined();
    });
});
