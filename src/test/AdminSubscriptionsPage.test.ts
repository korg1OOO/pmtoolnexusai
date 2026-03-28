/**
 * AdminSubscriptionsPage Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminSubscriptionsPage } from '@/components/admin/pages/AdminSubscriptionsPage';

describe('AdminSubscriptionsPage', () => {
    it('exports the component', () => {
        expect(AdminSubscriptionsPage).toBeDefined();
    });
});
