/**
 * PasswordStrengthIndicator Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';

describe('PasswordStrengthIndicator', () => {
    it('exports the component', () => {
        expect(PasswordStrengthIndicator).toBeDefined();
    });
});
