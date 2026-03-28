/**
 * TaskLockIndicator Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TaskLockIndicator } from '@/components/collaboration/TaskLockIndicator';

describe('TaskLockIndicator', () => {
    it('exports the component', () => {
        expect(TaskLockIndicator).toBeDefined();
    });
});
