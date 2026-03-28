/**
 * ResourceUsageView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ResourceUsageView } from '@/components/resources/ResourceUsageView';

describe('ResourceUsageView', () => {
    it('exports the component', () => {
        expect(ResourceUsageView).toBeDefined();
    });
});
