/**
 * DocumentPreview Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentPreview } from '@/components/analytics/governance/DocumentPreview';

describe('DocumentPreview', () => {
    it('exports the component', () => {
        expect(DocumentPreview).toBeDefined();
    });
});
