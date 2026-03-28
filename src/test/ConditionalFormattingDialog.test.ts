/**
 * ConditionalFormattingDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ConditionalFormattingDialog } from '@/components/notes/spreadsheet/ConditionalFormattingDialog';

describe('ConditionalFormattingDialog', () => {
    it('exports the component', () => {
        expect(ConditionalFormattingDialog).toBeDefined();
    });
});
