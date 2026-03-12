/**
 * DroppableZone Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DroppableZone } from '@/components/notes/dnd/DroppableZone';

describe('DroppableZone', () => {
    it('exports the component', () => {
        expect(DroppableZone).toBeDefined();
    });
});
