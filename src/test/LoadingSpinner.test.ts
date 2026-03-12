/**
 * LoadingSpinner Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LoadingSpinner } from '@/components/routing/LoadingSpinner';

describe('LoadingSpinner', () => {
    it('exports the component', () => {
        expect(LoadingSpinner).toBeDefined();
    });
});
