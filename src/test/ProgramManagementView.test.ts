/**
 * ProgramManagementView Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn(), loading: vi.fn() }) }));

import ProgramManagementView from '@/components/views/ProgramManagementView';

describe('ProgramManagementView', () => {
    it('exports the component', () => {
        expect(ProgramManagementView).toBeDefined();
    });
});
