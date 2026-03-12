/**
 * SprintCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SprintCard } from '@/components/sprint/SprintCard';

describe('SprintCard', () => {
    it('exports the component', () => {
        expect(SprintCard).toBeDefined();
    });
});
