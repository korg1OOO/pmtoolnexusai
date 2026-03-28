/**
 * DocumentList Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentList } from '@/components/documents/DocumentList';

describe('DocumentList', () => {
    it('exports the component', () => {
        expect(DocumentList).toBeDefined();
    });
});
