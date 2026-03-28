/**
 * MeetingCreationDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MeetingCreationDialog } from '@/components/meetings/MeetingCreationDialog';

describe('MeetingCreationDialog', () => {
    it('exports the component', () => {
        expect(MeetingCreationDialog).toBeDefined();
    });
});
