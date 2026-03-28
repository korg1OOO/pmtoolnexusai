/**
 * ProjectSwitcher Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ProjectSwitcher } from '@/components/layout/ProjectSwitcher';

describe('ProjectSwitcher', () => {
    it('exports the component', () => {
        expect(ProjectSwitcher).toBeDefined();
    });
});
