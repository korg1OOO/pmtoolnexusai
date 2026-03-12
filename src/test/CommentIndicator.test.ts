/**
 * CommentIndicator Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { CommentIndicator } from '@/components/notes/spreadsheet/collaboration/CommentIndicator';

describe('CommentIndicator', () => {
    it('exports the component', () => {
        expect(CommentIndicator).toBeDefined();
    });
});
