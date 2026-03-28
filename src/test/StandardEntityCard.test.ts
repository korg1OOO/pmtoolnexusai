/**
 * StandardEntityCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { StandardEntityCard } from '@/components/ui/StandardEntityCard';

describe('StandardEntityCard', () => {
    it('exports the component', () => {
        expect(StandardEntityCard).toBeDefined();
    });
});
