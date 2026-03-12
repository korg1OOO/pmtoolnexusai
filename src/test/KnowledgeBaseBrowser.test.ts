/**
 * KnowledgeBaseBrowser Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { createWrapper } from './testUtils';

import { KnowledgeBaseBrowser } from '@/components/program/KnowledgeBaseBrowser';

describe('KnowledgeBaseBrowser', () => {
    it('exports the component', () => {
        expect(KnowledgeBaseBrowser).toBeDefined();
    });
});
