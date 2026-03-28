/**
 * AdminHealthCheck Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminHealthCheck } from '@/components/admin/pages/AdminHealthCheck';

describe('AdminHealthCheck', () => {
    it('exports the component', () => {
        expect(AdminHealthCheck).toBeDefined();
    });
});
