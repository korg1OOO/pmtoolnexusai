/**
 * ProgramMilestoneTracker Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { ProgramMilestoneTracker } from '@/components/program/ProgramMilestoneTracker';

describe('ProgramMilestoneTracker', () => {
    it('exports the component', () => {
        expect(ProgramMilestoneTracker).toBeDefined();
    });
});
