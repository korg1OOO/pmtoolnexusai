/**
 * AdminMarketing Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminMarketing } from '@/components/admin/pages/AdminMarketing';

describe('AdminMarketing', () => {
    it('exports the component', () => {
        expect(AdminMarketing).toBeDefined();
    });
});
