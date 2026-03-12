/**
 * ActiveUsers Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ActiveUsers } from '@/components/collaboration/ActiveUsers';

describe('ActiveUsers', () => {
    it('exports the component', () => {
        expect(ActiveUsers).toBeDefined();
    });
});
