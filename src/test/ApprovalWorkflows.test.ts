/**
 * ApprovalWorkflows Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ApprovalWorkflows } from '@/components/analytics/governance/ApprovalWorkflows';

describe('ApprovalWorkflows', () => {
    it('exports the component', () => {
        expect(ApprovalWorkflows).toBeDefined();
    });
});
