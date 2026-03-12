/**
 * UserRoleManagement Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { UserRoleManagement } from '@/components/tenant/UserRoleManagement';

describe('UserRoleManagement', () => {
    it('exports the component', () => {
        expect(UserRoleManagement).toBeDefined();
    });
});
