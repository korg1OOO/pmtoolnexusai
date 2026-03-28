/**
 * ThemeProvider Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ThemeProvider } from '@/components/ThemeProvider';

describe('ThemeProvider', () => {
    it('exports the component', () => {
        expect(ThemeProvider).toBeDefined();
    });
});
