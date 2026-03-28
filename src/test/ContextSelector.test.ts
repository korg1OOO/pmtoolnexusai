/**
 * ContextSelector Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ContextSelector } from '@/components/ai/ContextSelector';

describe('ContextSelector', () => {
    it('exports the component', () => {
        expect(ContextSelector).toBeDefined();
    });
});
