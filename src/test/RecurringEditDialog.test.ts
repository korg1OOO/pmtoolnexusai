/**
 * RecurringEditDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { RecurringEditDialog } from '@/components/meetings/RecurringEditDialog';

describe('RecurringEditDialog', () => {
    it('exports the component', () => {
        expect(RecurringEditDialog).toBeDefined();
    });
});
