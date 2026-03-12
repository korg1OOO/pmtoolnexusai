/**
 * RichTextEditor Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { RichTextEditor } from '@/components/ui/RichTextEditor';

describe('RichTextEditor', () => {
    it('exports the component', () => {
        expect(RichTextEditor).toBeDefined();
    });
});
