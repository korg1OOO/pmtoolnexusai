/**
 * ShareDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ShareDialog } from '@/components/notes/spreadsheet/collaboration/ShareDialog';

describe('ShareDialog', () => {
    it('exports the component', () => {
        expect(ShareDialog).toBeDefined();
    });
});
