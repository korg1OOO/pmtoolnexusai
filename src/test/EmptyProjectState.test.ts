/**
 * EmptyProjectState Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { EmptyProjectState } from '@/components/EmptyProjectState';

describe('EmptyProjectState', () => {
    it('exports the component', () => {
        expect(EmptyProjectState).toBeDefined();
    });
});
