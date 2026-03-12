/**
 * DocumentMoveDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentMoveDialog } from '@/components/documents/DocumentMoveDialog';

describe('DocumentMoveDialog', () => {
    it('exports the component', () => {
        expect(DocumentMoveDialog).toBeDefined();
    });
});
