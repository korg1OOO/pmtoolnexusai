/**
 * IntentModeToggle Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { IntentModeToggle } from '@/components/ai/IntentModeToggle';

describe('IntentModeToggle', () => {
    it('exports the component', () => {
        expect(IntentModeToggle).toBeDefined();
    });
});
