/**
 * DraggableSpreadsheetItem Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { DraggableSpreadsheetItem } from '@/components/notes/dnd/DraggableSpreadsheetItem';

describe('DraggableSpreadsheetItem', () => {
    it('exports the component', () => {
        expect(DraggableSpreadsheetItem).toBeDefined();
    });
});
