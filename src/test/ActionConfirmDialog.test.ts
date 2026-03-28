/**
 * ActionConfirmDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ActionConfirmDialog } from '@/components/ai/ActionConfirmDialog';

describe('ActionConfirmDialog', () => {
    it('exports the component', () => {
        expect(ActionConfirmDialog).toBeDefined();
    });
});
