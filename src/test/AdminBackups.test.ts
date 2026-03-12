/**
 * AdminBackups Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminBackups } from '@/components/admin/pages/AdminBackups';

describe('AdminBackups', () => {
    it('exports the component', () => {
        expect(AdminBackups).toBeDefined();
    });
});
