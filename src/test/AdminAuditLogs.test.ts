/**
 * AdminAuditLogs Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AdminAuditLogs } from '@/components/admin/pages/AdminAuditLogs';

describe('AdminAuditLogs', () => {
    it('exports the component', () => {
        expect(AdminAuditLogs).toBeDefined();
    });
});
