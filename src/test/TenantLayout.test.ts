/**
 * TenantLayout Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TenantLayout } from '@/components/tenant/TenantLayout';

describe('TenantLayout', () => {
    it('exports the component', () => {
        expect(TenantLayout).toBeDefined();
    });
});
