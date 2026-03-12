/**
 * FolderCreateDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { FolderCreateDialog } from '@/components/documents/FolderCreateDialog';

describe('FolderCreateDialog', () => {
    it('exports the component', () => {
        expect(FolderCreateDialog).toBeDefined();
    });
});
