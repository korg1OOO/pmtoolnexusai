/**
 * SidePanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SidePanel } from '@/components/ui/SidePanel';

describe('SidePanel', () => {
    it('exports the component', () => {
        expect(SidePanel).toBeDefined();
    });
});
