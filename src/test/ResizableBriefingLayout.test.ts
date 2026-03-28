/**
 * ResizableBriefingLayout Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ResizableBriefingLayout } from '@/components/briefing/ResizableBriefingLayout';

describe('ResizableBriefingLayout', () => {
    it('exports the component', () => {
        expect(ResizableBriefingLayout).toBeDefined();
    });
});
