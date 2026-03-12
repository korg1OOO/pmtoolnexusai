/**
 * PageEditor Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PageEditor } from '@/components/notes/PageEditor';

describe('PageEditor', () => {
    it('exports the component', () => {
        expect(PageEditor).toBeDefined();
    });
});
