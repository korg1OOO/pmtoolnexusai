/**
 * AppShell Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { AppShell } from '@/components/layout/AppShell';

describe('AppShell', () => {
    it('exports the component', () => {
        expect(AppShell).toBeDefined();
    });
});
