/**
 * KPICard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { KPICard } from '@/components/enterprise/KPICard';

describe('KPICard', () => {
    it('exports the component', () => {
        expect(KPICard).toBeDefined();
    });
});
