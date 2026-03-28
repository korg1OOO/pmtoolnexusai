/**
 * SlidePropertiesPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SlidePropertiesPanel } from '@/components/presentations/SlidePropertiesPanel';

describe('SlidePropertiesPanel', () => {
    it('exports the component', () => {
        expect(SlidePropertiesPanel).toBeDefined();
    });
});
