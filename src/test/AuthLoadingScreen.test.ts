/**
 * AuthLoadingScreen Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AuthLoadingScreen } from '@/components/auth/AuthLoadingScreen';

describe('AuthLoadingScreen', () => {
    it('exports the component', () => {
        expect(AuthLoadingScreen).toBeDefined();
    });
});
