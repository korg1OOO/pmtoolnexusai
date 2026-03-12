/**
 * OfflineIndicator Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { OfflineIndicator } from '@/components/collaboration/OfflineIndicator';

describe('OfflineIndicator', () => {
    it('exports the component', () => {
        expect(OfflineIndicator).toBeDefined();
    });
});
