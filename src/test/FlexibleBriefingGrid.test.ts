/**
 * FlexibleBriefingGrid Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { FlexibleBriefingGrid } from '@/components/briefing/FlexibleBriefingGrid';

describe('FlexibleBriefingGrid', () => {
    it('exports the component', () => {
        expect(FlexibleBriefingGrid).toBeDefined();
    });
});
