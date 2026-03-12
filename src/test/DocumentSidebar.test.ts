/**
 * DocumentSidebar Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentSidebar } from '@/components/documents/DocumentSidebar';

describe('DocumentSidebar', () => {
    it('exports the component', () => {
        expect(DocumentSidebar).toBeDefined();
    });
});
