/**
 * PresenceCursors Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PresenceCursors } from '@/components/notes/spreadsheet/collaboration/PresenceCursors';

describe('PresenceCursors', () => {
    it('exports the component', () => {
        expect(PresenceCursors).toBeDefined();
    });
});
