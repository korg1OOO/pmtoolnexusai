/**
 * DocumentGrid Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentGrid } from '@/components/documents/DocumentGrid';

describe('DocumentGrid', () => {
    it('exports the component', () => {
        expect(DocumentGrid).toBeDefined();
    });
});
