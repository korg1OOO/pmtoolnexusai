/**
 * AdminSecurity Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminSecurity } from '@/components/admin/pages/AdminSecurity';

describe('AdminSecurity', () => {
    it('exports the component', () => {
        expect(AdminSecurity).toBeDefined();
    });
});
