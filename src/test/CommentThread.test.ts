/**
 * CommentThread Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { CommentThread } from '@/components/notes/spreadsheet/collaboration/CommentThread';

describe('CommentThread', () => {
    it('exports the component', () => {
        expect(CommentThread).toBeDefined();
    });
});
