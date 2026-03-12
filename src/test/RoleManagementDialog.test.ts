/**
 * RoleManagementDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { RoleManagementDialog } from '@/components/team/RoleManagementDialog';

describe('RoleManagementDialog', () => {
    it('exports the component', () => {
        expect(RoleManagementDialog).toBeDefined();
    });
});
