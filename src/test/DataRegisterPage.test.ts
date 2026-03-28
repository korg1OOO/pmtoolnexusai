/**
 * DataRegisterPage Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DataRegisterPage } from '@/components/ui/DataRegisterPage';

describe('DataRegisterPage', () => {
    it('exports the component', () => {
        expect(DataRegisterPage).toBeDefined();
    });
});
