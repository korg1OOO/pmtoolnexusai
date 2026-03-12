/**
 * PageContextPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PageContextPanel } from '@/components/ai/PageContextPanel';

describe('PageContextPanel', () => {
    it('exports the component', () => {
        expect(PageContextPanel).toBeDefined();
    });
});
