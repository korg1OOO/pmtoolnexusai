/**
 * DelegationList Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DelegationList } from '@/components/analytics/governance/DelegationList';

describe('DelegationList', () => {
    it('exports the component', () => {
        expect(DelegationList).toBeDefined();
    });
});
