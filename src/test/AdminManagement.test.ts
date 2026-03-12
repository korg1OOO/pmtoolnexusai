/**
 * AdminManagement Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminManagement } from '@/components/admin/pages/AdminManagement';

describe('AdminManagement', () => {
    it('exports the component', () => {
        expect(AdminManagement).toBeDefined();
    });
});
