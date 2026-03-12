/**
 * ShapeLibrary Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ShapeLibrary } from '@/components/presentations/ShapeLibrary';

describe('ShapeLibrary', () => {
    it('exports the component', () => {
        expect(ShapeLibrary).toBeDefined();
    });
});
