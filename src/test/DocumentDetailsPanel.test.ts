/**
 * DocumentDetailsPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentDetailsPanel } from '@/components/documents/DocumentDetailsPanel';

describe('DocumentDetailsPanel', () => {
    it('exports the component', () => {
        expect(DocumentDetailsPanel).toBeDefined();
    });
});
