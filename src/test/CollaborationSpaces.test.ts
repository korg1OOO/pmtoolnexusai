/**
 * CollaborationSpaces Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { CollaborationSpaces } from '@/components/program/CollaborationSpaces';

describe('CollaborationSpaces', () => {
    it('exports the component', () => {
        expect(CollaborationSpaces).toBeDefined();
    });
});
