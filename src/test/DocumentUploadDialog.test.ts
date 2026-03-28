/**
 * DocumentUploadDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentUploadDialog } from '@/components/documents/DocumentUploadDialog';

describe('DocumentUploadDialog', () => {
    it('exports the component', () => {
        expect(DocumentUploadDialog).toBeDefined();
    });
});
