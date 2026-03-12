/**
 * ConflictResolutionDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ConflictResolutionDialog } from '@/components/collaboration/ConflictResolutionDialog';

describe('ConflictResolutionDialog', () => {
    it('exports the component', () => {
        expect(ConflictResolutionDialog).toBeDefined();
    });
});
