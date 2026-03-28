/**
 * AdminContentManagement Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminContentManagement } from '@/components/admin/pages/AdminContentManagement';

describe('AdminContentManagement', () => {
    it('exports the component', () => {
        expect(AdminContentManagement).toBeDefined();
    });
});
