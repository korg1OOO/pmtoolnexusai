/**
 * ClarifyingQuestion Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ClarifyingQuestion } from '@/components/ai/ClarifyingQuestion';

describe('ClarifyingQuestion', () => {
    it('exports the component', () => {
        expect(ClarifyingQuestion).toBeDefined();
    });
});
