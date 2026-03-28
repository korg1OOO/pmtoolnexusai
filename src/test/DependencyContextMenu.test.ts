/**
 * DependencyContextMenu Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DependencyContextMenu } from '@/components/planning/DependencyContextMenu';

describe('DependencyContextMenu', () => {
    it('exports the component', () => {
        expect(DependencyContextMenu).toBeDefined();
    });
});
