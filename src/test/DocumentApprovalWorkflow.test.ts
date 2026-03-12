/**
 * DocumentApprovalWorkflow Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DocumentApprovalWorkflow } from '@/components/documents/DocumentApprovalWorkflow';

describe('DocumentApprovalWorkflow', () => {
    it('exports the component', () => {
        expect(DocumentApprovalWorkflow).toBeDefined();
    });
});
