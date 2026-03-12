/**
 * IssuesSection Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { IssuesSection } from '@/components/briefing/sections/IssuesSection';

describe('IssuesSection', () => {
    it('exports the component', () => {
        expect(IssuesSection).toBeDefined();
    });
});
