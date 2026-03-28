/**
 * DocumentShareDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentShareDialog } from '@/components/documents/DocumentShareDialog';

describe('DocumentShareDialog', () => {
    it('exports the component', () => {
        expect(DocumentShareDialog).toBeDefined();
    });
});
