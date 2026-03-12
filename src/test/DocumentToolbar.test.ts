/**
 * DocumentToolbar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentToolbar } from '@/components/documents/DocumentToolbar';

describe('DocumentToolbar', () => {
    it('exports the component', () => {
        expect(DocumentToolbar).toBeDefined();
    });
});
