/**
 * NotebookSidebar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { NotebookSidebar } from '@/components/notes/NotebookSidebar';

describe('NotebookSidebar', () => {
    it('exports the component', () => {
        expect(NotebookSidebar).toBeDefined();
    });
});
