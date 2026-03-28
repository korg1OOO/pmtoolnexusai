/**
 * CollaboratorCursors Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { CollaboratorCursors } from '@/components/collaboration/CollaboratorCursors';

describe('CollaboratorCursors', () => {
    it('exports the component', () => {
        expect(CollaboratorCursors).toBeDefined();
    });
});
