/**
 * ComponentPicker Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ComponentPicker } from '@/components/presentations/ComponentPicker';

describe('ComponentPicker', () => {
    it('exports the component', () => {
        expect(ComponentPicker).toBeDefined();
    });
});
