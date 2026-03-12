/**
 * SEOMeta Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SEOMeta } from '@/components/seo/SEOMeta';

describe('SEOMeta', () => {
    it('exports the component', () => {
        expect(SEOMeta).toBeDefined();
    });
});
