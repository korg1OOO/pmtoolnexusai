/**
 * PolicyDocuments Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PolicyDocuments } from '@/components/analytics/governance/PolicyDocuments';

describe('PolicyDocuments', () => {
    it('exports the component', () => {
        expect(PolicyDocuments).toBeDefined();
    });
});
