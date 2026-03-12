/**
 * AdminOverrideDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminOverrideDialog } from '@/components/analytics/governance/AdminOverrideDialog';

describe('AdminOverrideDialog', () => {
    it('exports the component', () => {
        expect(AdminOverrideDialog).toBeDefined();
    });
});
