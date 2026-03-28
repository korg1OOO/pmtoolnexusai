/**
 * ResourceAssignmentDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import { ResourceAssignmentDialog } from '@/components/resources/ResourceAssignmentDialog';

describe('ResourceAssignmentDialog', () => {
    it('exports the component', () => {
        expect(ResourceAssignmentDialog).toBeDefined();
    });
});
