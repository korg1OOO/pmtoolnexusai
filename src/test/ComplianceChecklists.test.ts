/**
 * ComplianceChecklists Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ComplianceChecklists } from '@/components/analytics/governance/ComplianceChecklists';

describe('ComplianceChecklists', () => {
    it('exports the component', () => {
        expect(ComplianceChecklists).toBeDefined();
    });
});
