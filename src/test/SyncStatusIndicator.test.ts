/**
 * SyncStatusIndicator Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SyncStatusIndicator } from '@/components/sync/SyncStatusIndicator';

describe('SyncStatusIndicator', () => {
    it('exports the component', () => {
        expect(SyncStatusIndicator).toBeDefined();
    });
});
