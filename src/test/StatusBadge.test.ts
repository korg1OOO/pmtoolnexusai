/**
 * StatusBadge Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { StatusBadge } from '@/components/ui/StatusBadge';

describe('StatusBadge', () => {
    it('exports the component', () => {
        expect(StatusBadge).toBeDefined();
    });
});
