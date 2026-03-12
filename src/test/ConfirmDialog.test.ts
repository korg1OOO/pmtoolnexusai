/**
 * ConfirmDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

describe('ConfirmDialog', () => {
    it('exports the component', () => {
        expect(ConfirmDialog).toBeDefined();
    });
});
