/**
 * AdminUserRolesPage Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminUserRolesPage } from '@/components/admin/pages/AdminUserRolesPage';

describe('AdminUserRolesPage', () => {
    it('exports the component', () => {
        expect(AdminUserRolesPage).toBeDefined();
    });
});
