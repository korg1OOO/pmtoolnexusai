/**
 * ProgramDocumentLibrary Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { ProgramDocumentLibrary } from '@/components/program/ProgramDocumentLibrary';

describe('ProgramDocumentLibrary', () => {
    it('exports the component', () => {
        expect(ProgramDocumentLibrary).toBeDefined();
    });
});
