/**
 * EntityFormDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { EntityFormDialog } from '@/components/ui/EntityFormDialog';

describe('EntityFormDialog', () => {
    it('exports the component', () => {
        expect(EntityFormDialog).toBeDefined();
    });
});
